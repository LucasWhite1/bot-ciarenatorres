# WhatsApp Bot - Evolution API

Este é um bot simples de WhatsApp utilizando a Evolution API v2.

## Configuração

1. O projeto já está configurado com suas credenciais no arquivo `.env`.
2. Instale as dependências:
   ```bash
   npm install
   ```

## Como Usar

### 1. Iniciar o Servidor Local
Para rodar o bot localmente:
```bash
npm start
```
O servidor rodará por padrão na porta `3000`.

### 2. Expor o Servidor (Webhook)
Como o WhatsApp precisa enviar mensagens para o seu servidor, você precisa de uma URL pública. Recomendamos o uso do **ngrok**:
```bash
ngrok http 3000
```
Copie a URL `https` gerada (ex: `https://abcd-123.ngrok-free.app`).

### 3. Configurar o Webhook na API
Com a URL do ngrok em mãos, rode o comando de setup:
```bash
npm run setup -- <SUA_URL_NGROK>/webhook
```
Exemplo:
```bash
npm run setup -- https://abcd-123.ngrok-free.app/webhook
```

### 4. Testar o Bot
Envie qualquer mensagem para o número `71993615509`.
- Se digitar `1`, o bot responderá sobre a opção 1.
- Se digitar `2`, o bot responderá sobre a opção 2.
- Qualquer outra mensagem enviará o menu inicial.

## Estrutura do Projeto
- `index.js`: Lógica principal do bot e servidor Express.
- `setup-webhook.js`: Script utilitário para configurar o webhook na Evolution API.
- `check-status.js`: Verifica se a instância do WhatsApp está conectada.
- `.env`: Armazena as chaves e URLs da API.
