# Configurar Webhook do Telegram usando curl

Este documento contém os comandos curl para configurar o webhook do Telegram manualmente.

## Pré-requisitos

1. **Bot Token do Telegram**: Obtenha em [@BotFather](https://t.me/BotFather)
2. **URL do Webhook**: URL pública do seu endpoint (ex: `https://controliaa.vercel.app/api/webhooks/telegram`)

## Comandos curl

### 1. Verificar status atual do webhook

```bash
curl -X GET "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

**Exemplo:**
```bash
curl -X GET "https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/getWebhookInfo"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": {
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 2. Configurar webhook

```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    "allowed_updates": ["message", "edited_message", "callback_query"]
  }'
```

**Exemplo completo:**
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    "allowed_updates": ["message", "edited_message", "callback_query"]
  }'
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### 3. Remover webhook (se necessário)

```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/deleteWebhook"
```

### 4. Testar webhook

Após configurar, envie uma mensagem para o bot do Telegram e verifique:
- Se a mensagem aparece no Controlia
- Se há erros nos logs do servidor
- Se o webhook está recebendo as requisições

## Scripts automatizados

### Linux/Mac (Bash)

```bash
# Dar permissão de execução
chmod +x scripts/configurar-webhook-telegram.sh

# Executar
./scripts/configurar-webhook-telegram.sh <BOT_TOKEN> [WEBHOOK_URL]
```

### Windows (PowerShell)

```powershell
.\scripts\configurar-webhook-telegram.ps1 -BotToken "SEU_TOKEN" -WebhookUrl "https://controliaa.vercel.app/api/webhooks/telegram"
```

## Troubleshooting

### Erro: "Bad Request"

- Verifique se a URL do webhook está acessível publicamente
- Verifique se a URL usa HTTPS (obrigatório para webhooks do Telegram)
- Verifique se o endpoint retorna status 200 OK

### Erro: "Unauthorized"

- Verifique se o Bot Token está correto
- Verifique se o bot não foi deletado ou desabilitado

### Webhook não recebe mensagens

1. Verifique o status do webhook:
   ```bash
   curl -X GET "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
   ```

2. Verifique se há erros pendentes no campo `last_error_message`

3. Teste o endpoint manualmente:
   ```bash
   curl -X POST "https://controliaa.vercel.app/api/webhooks/telegram" \
     -H "Content-Type: application/json" \
     -d '{
       "update_id": 123456789,
       "message": {
         "message_id": 1,
         "from": {
           "id": 123456789,
           "is_bot": false,
           "first_name": "Teste"
         },
         "chat": {
           "id": 123456789,
           "type": "private"
         },
         "date": 1234567890,
         "text": "Teste"
       }
     }'
   ```

## Variáveis de ambiente

Você pode configurar variáveis de ambiente para facilitar:

```bash
export TELEGRAM_BOT_TOKEN="seu_token_aqui"
export WEBHOOK_URL="https://controliaa.vercel.app/api/webhooks/telegram"
```

Então use nos comandos:
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"allowed_updates\": [\"message\", \"edited_message\", \"callback_query\"]}"
```

