# 🔧 Solução: Webhook do Telegram Não Está Sendo Chamado

## 🔍 Problema Identificado

Os logs da Vercel mostram:
- ✅ Chamadas para `/api/webhooks/n8n/channel-response` (respostas do n8n)
- ❌ **NENHUMA chamada para `/api/webhooks/telegram`** (mensagens do contato)

**Isso significa que:**
- O Telegram **NÃO está enviando** mensagens para o Controlia
- O webhook do Telegram provavelmente está configurado para apontar para o **n8n diretamente**
- As mensagens do contato não estão chegando ao Controlia

## ✅ Solução: Reconfigurar Webhook do Telegram

O webhook do Telegram precisa apontar para o **Controlia**, não para o n8n diretamente.

### Fluxo Correto:
```
Telegram → Controlia → n8n → Controlia → Telegram
```

### Fluxo Incorreto (atual):
```
Telegram → n8n → Controlia → Telegram
(As mensagens do contato não são salvas no Controlia)
```

## 📋 Passos para Corrigir

### Passo 1: Obter o Token do Bot

Você já tem o token: `8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg`

### Passo 2: Configurar Webhook para Controlia

Execute este comando no terminal (ou use curl):

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

### Passo 3: Verificar Configuração

Execute este comando para verificar:

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": {
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

### Passo 4: Testar

1. **Envie uma mensagem** do Telegram para o bot
2. **Verifique os logs da Vercel** - deve aparecer uma chamada para `/api/webhooks/telegram`
3. **Verifique no banco** - execute o script `supabase/verificar-mensagens-inbound-recentes.sql`
4. **Verifique na plataforma** - a mensagem deve aparecer na conversa

## 🔍 Verificação no Banco

Após configurar o webhook e enviar uma mensagem, execute:

```sql
-- Verificar mensagens inbound do Telegram (últimos 10 minutos)
SELECT 
  m.id,
  m.direction,
  m.sender_type,
  m.content,
  m.created_at,
  c.channel,
  c.channel_thread_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY m.created_at DESC;
```

Deve retornar as mensagens do contato.

## 🚨 Se Ainda Não Funcionar

### 1. Verificar Logs da Vercel

Procure por:
- Chamadas para `/api/webhooks/telegram`
- Erros 404, 500, etc.
- Logs de console do webhook

### 2. Verificar Webhook do Telegram

Execute novamente:
```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

Verifique se a `url` está correta.

### 3. Verificar se o Endpoint Está Funcionando

Teste o endpoint diretamente:
```bash
curl -X POST https://controliaa.vercel.app/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"message_id": 1, "from": {"id": 7772641515, "first_name": "Test"}, "chat": {"id": 7772641515, "type": "private"}, "date": 1234567890, "text": "Teste"}}'
```

Deve retornar `200 OK`.

## 📚 Documentação Adicional

- `docs/CORRIGIR_WEBHOOK_TELEGRAM.md` - Guia completo de configuração
- `supabase/verificar-webhook-telegram-configurado.sql` - Script de verificação
