# Configuração do Webhook do Telegram

## ⚠️ PROBLEMA IDENTIFICADO

Quando uma mensagem é enviada do Telegram, ela não aparece no Controlia - está indo direto para o n8n.

## ✅ FLUXO CORRETO

```
Telegram → Controlia (/api/webhooks/telegram)
  ↓
Controlia salva mensagem no banco
  ↓
Controlia busca automação
  ↓
Controlia envia para n8n
  ↓
n8n processa
  ↓
n8n retorna para Controlia (/api/webhooks/n8n/channel-response)
  ↓
Controlia salva resposta
  ↓
Controlia envia para Telegram
```

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### 1. Webhook do Telegram DEVE apontar para o Controlia

**URL CORRETA:**
```
https://seu-dominio.com/api/webhooks/telegram
```

**NÃO deve apontar para:**
- ❌ `https://n8n.exemplo.com/webhook/xxx` (direto para n8n)
- ❌ `https://seu-dominio.com/api/webhooks/n8n/...` (endpoint errado)

### 2. Como Configurar no Telegram

1. Acesse o BotFather no Telegram
2. Use o comando `/setwebhook`
3. Configure a URL:
   ```
   /setwebhook
   URL: https://seu-dominio.com/api/webhooks/telegram
   ```

Ou via API do Telegram:
```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-dominio.com/api/webhooks/telegram"}'
```

### 3. Verificar Webhook Atual

```bash
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": {
    "url": "https://seu-dominio.com/api/webhooks/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 🔍 DIAGNÓSTICO

### Verificar se mensagem está sendo salva no Controlia

Execute no SQL Editor do Supabase:

```sql
-- Verificar últimas mensagens recebidas do Telegram
SELECT 
  m.id,
  m.content,
  m.direction,
  m.sender_type,
  m.company_id,
  m.conversation_id,
  m.created_at,
  c.channel,
  c.company_id as conversation_company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
ORDER BY m.created_at DESC
LIMIT 10;
```

**Se não encontrar mensagens:**
- ❌ Webhook do Telegram não está sendo chamado
- ❌ Webhook está apontando para lugar errado
- ❌ Erro ao salvar mensagem (verificar logs)

### Verificar logs do webhook

Procure nos logs do servidor por:
- `📥 Webhook Telegram recebido`
- `✅ Mensagem criada com sucesso`
- `📤 ENVIANDO para n8n`

## 🛠️ CORREÇÕES NECESSÁRIAS

### 1. Garantir que mensagem é salva ANTES de enviar para n8n

O código já faz isso, mas vamos garantir que está funcionando:

```typescript
// 1. Salvar mensagem PRIMEIRO
const newMessage = await serviceClient
  .from('messages')
  .insert(messageData)
  .select()
  .single()

// 2. DEPOIS buscar automações
const automations = await supabase
  .from('automations')
  .select('*')
  // ...

// 3. DEPOIS enviar para n8n
if (automations && automations.length > 0) {
  await fetch(automation.n8n_webhook_url, { ... })
}
```

### 2. Garantir que RLS permite visualização

Execute o script de correção RLS:
```sql
-- Ver arquivo: supabase/corrigir-rls-messages-para-leitura.sql
```

### 3. Garantir consistência de company_id

Execute o script de correção:
```sql
-- Ver arquivo: supabase/solucao-mensagens-inbound-nao-aparecem.sql
```

