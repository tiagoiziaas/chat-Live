import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import qrcode from 'qrcode';
import waPkg from 'whatsapp-web.js';
const { Client, LocalAuth } = waPkg;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve static build (opcional)
app.use(express.static('dist'));

let waClient = null;

// Global handlers to prevent the process from exiting on unexpected errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

function initWhatsappClient() {
  try {
    waClient = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: { headless: true }
    });

    waClient.on('qr', async (qr) => {
      try {
        const dataUrl = await qrcode.toDataURL(qr);
        io.emit('qr', dataUrl);
        console.log('QR gerado e enviado via socket');
      } catch (err) {
        console.error('Erro gerando QR:', err);
      }
    });

    waClient.on('ready', () => {
      io.emit('ready');
      // try to extract authenticated user's id/number
      let userId = undefined;
      try {
        // whatsapp-web.js exposes info; check common paths
        if (waClient.info && waClient.info.wid && waClient.info.wid.user) userId = waClient.info.wid.user;
        if (!userId && waClient.info && waClient.info.me && waClient.info.me.user) userId = waClient.info.me.user;
      } catch (e) {
        // ignore
      }
      if (userId) io.emit('user_authenticated', { userId });
      console.log('WhatsApp pronto', userId);
    });

    // when a message is received by the WhatsApp client, forward it to connected sockets
    waClient.on('message', (msg) => {
      try {
        const payload = {
          id: msg.id ? (msg.id._serialized || msg.id) : undefined,
          from: msg.from || msg._data?.from,
          body: msg.body || msg._data?.body,
          timestamp: msg.timestamp || Date.now()
        };
        io.emit('incoming_message', payload);
        console.log('Incoming message forwarded to sockets:', payload);
      } catch (err) {
        console.error('Erro ao processar mensagem recebida:', err);
      }
    });

    waClient.on('auth_failure', (msg) => {
      console.error('Auth failure', msg);
      io.emit('auth_failure', msg);
    });

    waClient.on('disconnected', async (reason) => {
      console.log('WhatsApp desconectado', reason);
      io.emit('disconnected', reason);
      // try to gracefully destroy and re-init after short delay
      try {
        await waClient.destroy();
      } catch (err) {
        console.error('Erro ao destruir client:', err);
      }
      setTimeout(() => {
        console.log('Tentando reinicializar o cliente WhatsApp...');
        initWhatsappClient();
      }, 3000);
    });

    waClient.initialize();
  } catch (err) {
    console.error('Erro ao inicializar WhatsApp client:', err);
    // retry after delay
    setTimeout(initWhatsappClient, 3000);
  }
}

initWhatsappClient();

io.on('connection', (socket) => {
  console.log('Socket conectado:', socket.id);
  socket.on('disconnect', () => console.log('Socket desconectou:', socket.id));

  // receive message from frontend to send via WhatsApp
  socket.on('send_message', async (payload) => {
    // payload: { to: string, message: string, tempId?: string }
    const { to, message, tempId } = payload || {};
    if (!waClient) {
      socket.emit('message_error', { tempId, error: 'WhatsApp client not initialized' });
      return;
    }

    try {
      const sent = await waClient.sendMessage(to, message);
      // emit success with original tempId and server message id
      socket.emit('message_sent', { tempId, id: sent.id._serialized });
      // broadcast outgoing message to any UI cards
      io.emit('outgoing_message', {
        to,
        body: message,
        id: sent.id._serialized,
        tempId,
        status: 'sent'
      });
    } catch (err) {
      console.error('Erro enviando mensagem:', err);
      socket.emit('message_error', { tempId, error: String(err) });
      io.emit('outgoing_message', { to, body: message, tempId, status: 'error', error: String(err) });
    }
  });
  
  // send bulk messages: payload { numbers: string[], body: string, batchId?: string }
  socket.on('send_bulk', async (payload) => {
    const { numbers, body, batchId } = payload || {};
    if (!Array.isArray(numbers) || numbers.length === 0) {
      socket.emit('bulk_progress', { batchId, error: 'No numbers provided', total: 0, sent: 0 });
      return;
    }

    const total = numbers.length;
    let sentCount = 0;

    // helper to normalize phone -> whatsapp id
    const normalize = (raw) => {
      if (!raw) return null;
      let s = String(raw).trim();
      // if already looks like an id
      if (s.endsWith('@c.us') || s.endsWith('@g.us')) return s;
      // remove non-digits
      s = s.replace(/\D+/g, '');
      if (!s) return null;
      return `${s}@c.us`;
    };

    for (let i = 0; i < numbers.length; i++) {
      const raw = numbers[i];
      const to = normalize(raw);
      if (!to) {
        io.emit('bulk_progress', { batchId, index: i, total, to: raw, status: 'skipped', error: 'invalid number' });
        continue;
      }

      try {
        const res = await waClient.sendMessage(to, body);
        sentCount++;
        // notify progress to all clients
        io.emit('bulk_progress', { batchId, index: i, total, to, status: 'sent', id: res.id ? (res.id._serialized || res.id) : undefined });
        // also emit as outgoing_message to list
        io.emit('outgoing_message', { to, body, id: res.id ? (res.id._serialized || res.id) : undefined, status: 'sent' });
      } catch (err) {
        console.error('bulk send error to', to, err);
        io.emit('bulk_progress', { batchId, index: i, total, to, status: 'error', error: String(err) });
      }

      // small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }

    io.emit('bulk_complete', { batchId, total, sent: sentCount });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server (Socket+WA) listening on ${PORT}`));

