# Bot Cia. Renato Torres

Bot de WhatsApp em Node.js + Express, integrado com a Evolution API, pronto para deploy em VPS com Easypanel.

## O que este projeto faz

- Recebe mensagens do WhatsApp via webhook da Evolution API.
- Responde com menu automático.
- Qualifica o lead antes de falar com atendente.
- Coleta dados para visita ou aula teste.
- Envia resumo interno do lead para um número configurado.
- Espera 1 hora para reenviar a saudação inicial após o fim do fluxo.
- Pode salvar sessões em Redis, com fallback em memória.
- Possui rota protegida para aviso de mensalidade do sistema.
- Está pronto para rodar com Docker.

## Como configurar o `.env`

Copie o arquivo de exemplo:

```powershell
Copy-Item .env.example .env
```

Preencha os dados da Evolution API e do negócio.

### Redis

Para usar Redis:

```env
REDIS_ENABLED=true
REDIS_URL=redis://redis:6379
REDIS_KEY_PREFIX=cia-renato-torres:session
SESSION_TTL_SECONDS=86400
MENU_COOLDOWN_MINUTES=60
```

Se não quiser Redis por enquanto:

```env
REDIS_ENABLED=false
```

## Como rodar localmente

```bash
npm install
npm start
```

Teste:

```bash
curl http://localhost:3000/health
```

## Como configurar no Easypanel

1. Suba o projeto no GitHub.
2. Crie o app no Easypanel apontando para o repositório.
3. Configure a porta `3000`.
4. Cadastre todas as variáveis do `.env`.
5. Se usar Redis, crie um serviço Redis no Easypanel e ajuste `REDIS_URL`.

## Como configurar o webhook na Evolution

Use a URL pública:

```text
https://SEU_DOMINIO/webhook/evolution
```

Ative o evento de mensagens recebidas da instância.

## Como testar o webhook no PowerShell

```powershell
$body = @{
  data = @{
    key = @{
      remoteJid = "5571999999999@s.whatsapp.net"
      fromMe = $false
    }
    message = @{
      conversation = "oi"
    }
  }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Method POST `
  -Uri "http://localhost:3000/webhook/evolution" `
  -ContentType "application/json" `
  -Body $body
```

## Como testar o alerta de mensalidade

```bash
curl -X POST http://localhost:3000/billing/send-reminder \
  -H "Authorization: Bearer sua_senha_forte"
```

## Observações

- Digitar `menu` ou `reiniciar` volta para o menu principal.
- Após concluir o fluxo, o bot não reenvia a mensagem inicial por 1 hora.
- Redis é a opção recomendada para produção porque mantém sessão entre reinícios e múltiplas réplicas.
