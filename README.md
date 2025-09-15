# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f648b788-fc57-4cb3-a03f-f689937c1a0e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f648b788-fc57-4cb3-a03f-f689937c1a0e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Rodando o projeto (frontend + servidor WhatsApp)

1. Instale dependências:

```sh
npm install
```

2. Abra um terminal e rode o frontend (Vite):

```sh
npm run dev
```

3. Abra outro terminal e execute o servidor que gerencia o WhatsApp (Socket.IO + whatsapp-web.js):

```sh
npm start
```

4. Acesse a UI (normalmente em http://localhost:5173) e a tela de autenticação exibirá um QR code gerado pelo servidor. Escaneie com o WhatsApp para conectar.

Observações:
- O servidor usa `whatsapp-web.js` com `LocalAuth` e salvará sessão em `.wwebjs_auth`.
- Se precisar rodar o servidor em outra porta, ajuste o cliente (io('http://localhost:3000')) no componente `src/components/WhatsappSocket.tsx` e em `src/components/QRCodeAuth.tsx`.

## Teste fim-a-fim (envio e recebimento)

1. Inicie o frontend e o servidor conforme as instruções acima.
2. Autentique o WhatsApp escaneando o QR exibido na tela.
3. No app, abra uma conversa cujo `chat.id` corresponda ao ID do destinatário no WhatsApp (ex: '5511999999999@c.us').
4. Envie uma mensagem pela plataforma: ela aparecerá como "sending" e mudará para "sent" quando o servidor confirmar.
5. Envie uma mensagem do celular para o número autenticado: a mensagem deverá aparecer automaticamente na UI como recebida.

Nota: confirme o formato do campo `chat.id` usado na lista de conversas — o `to` enviado ao servidor precisa ser o ID aceito pelo `whatsapp-web.js`.


**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f648b788-fc57-4cb3-a03f-f689937c1a0e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
