# 🔍 Revisão Completa: Por Que Mensagens Não Aparecem

## 🔍 Problema Identificado

O log da Vercel mostra apenas:
```
POST /api/webhooks/n8n/channel-response status=200
```

**Mas NÃO mostra:**
```
POST /api/webhooks/telegram
```

Isso indica que **o Telegram não está enviando mensagens para o Controlia**, ou as mensagens estão sendo salvas mas não aparecem na UI.

## ✅ Passos para Diagnosticar

### Passo 1: Verificar se o Webhook do Telegram Está Configurado

Execute no terminal:

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

**Deve mostrar:**
```json
{
  "ok": true,
  "result": {
    "url": "https://controliaa.vercel.app/api/webhooks/telegram",
    ...
  }
}
```

**Se mostrar outra URL (ex: `https://controlia.up.railway.app/...`):**
- ❌ O webhook está apontando para o n8n, não para o Controlia
- ✅ Execute: `curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"`

### Passo 2: Verificar Mensagens no Banco de Dados

Execute o script `supabase/verificar-mensagens-nao-aparecem.sql`:

**Verifique:**
- ✅ Há mensagens inbound do Telegram nas últimas 2 horas?
- ✅ As mensagens têm `direction = 'inbound'` e `sender_type = 'human'`?
- ✅ As mensagens têm `company_id` configurado?
- ✅ As mensagens estão associadas à conversa correta?

### Passo 3: Verificar Logs da Vercel

Após enviar uma mensagem no Telegram, verifique os logs da Vercel:

**Logs esperados:**
```
📥 Webhook Telegram recebido: ...
📨 Processando mensagem do Telegram: ...
✅ Contato encontrado/criado: ...
✅ Conversa encontrada/criada: ...
✅ Mensagem criada com sucesso: ...
✅ Mensagem inbound salva no banco - ID: ...
```

**Se NÃO aparecer `📥 Webhook Telegram recebido:`:**
- ❌ O Telegram não está enviando para o Controlia
- ✅ Reconfigure o webhook do Telegram (Passo 1)

**Se aparecer mas não aparecer `✅ Mensagem criada com sucesso:`:**
- ❌ Há erro ao salvar a mensagem
- ✅ Verifique os logs de erro na Vercel

### Passo 4: Verificar RLS (Row Level Security)

Execute:

```sql
-- Verificar políticas RLS para messages
SELECT 
  polname AS policy_name,
  polpermissive AS permissive,
  polcmd AS cmd,
  polroles AS roles,
  pg_get_expr(polqual, polrelid) AS qual,
  pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;
```

**Verifique:**
- ✅ Há política que permite `SELECT` para usuários autenticados?
- ✅ A política permite ler mensagens com `company_id` da empresa do usuário?

### Passo 5: Verificar Filtros na UI

O componente `ConversationDetailView` carrega mensagens com:

```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*, user_profiles:sender_id(full_name)')
  .eq('conversation_id', conversation.id)
  .order('created_at', { ascending: true })
  .limit(100)
```

**Verifique:**
- ✅ O `conversation.id` está correto?
- ✅ Há mensagens com esse `conversation_id` no banco?
- ✅ O usuário tem permissão para ler essas mensagens (RLS)?

## 🎯 Soluções

### Solução 1: Reconfigurar Webhook do Telegram

Se o webhook não estiver apontando para o Controlia:

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

### Solução 2: Verificar Mensagens no Banco

Execute:

```sql
-- Verificar mensagens recentes do Telegram
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.content,
  m.created_at,
  c.channel,
  c.status
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '2 hours'
ORDER BY m.created_at DESC
LIMIT 20;
```

**Se não houver mensagens:**
- ❌ O webhook do Telegram não está sendo chamado
- ✅ Reconfigure o webhook (Solução 1)

**Se houver mensagens mas não aparecerem na UI:**
- ❌ Problema de RLS ou filtro
- ✅ Verifique RLS (Passo 4)

### Solução 3: Verificar Company ID

Execute:

```sql
-- Verificar se company_id das mensagens corresponde ao company_id do usuário
SELECT 
  m.id,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  cu.company_id as user_company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
CROSS JOIN company_users cu
WHERE cu.user_id = auth.uid()
  AND m.created_at > NOW() - INTERVAL '2 hours'
LIMIT 10;
```

**Se os `company_id` não corresponderem:**
- ❌ As mensagens foram criadas com `company_id` diferente
- ✅ Atualize o `company_id` das mensagens/conversas

## 📋 Checklist

- [ ] Webhook do Telegram configurado para Controlia (`getWebhookInfo`)
- [ ] Mensagens sendo salvas no banco (SQL)
- [ ] Logs da Vercel mostram `📥 Webhook Telegram recebido`
- [ ] Logs da Vercel mostram `✅ Mensagem criada com sucesso`
- [ ] Mensagens têm `company_id` correto
- [ ] RLS permite ler mensagens
- [ ] UI carrega mensagens corretamente

## ⚠️ Problemas Comuns

### Problema 1: Webhook Não Configurado
**Sintoma:** Logs não mostram `📥 Webhook Telegram recebido`
**Solução:** Reconfigure o webhook do Telegram

### Problema 2: Mensagens Não São Salvas
**Sintoma:** Logs mostram erro ao criar mensagem
**Solução:** Verifique RLS e logs de erro

### Problema 3: Mensagens Salvas Mas Não Aparecem
**Sintoma:** Mensagens no banco mas não na UI
**Solução:** Verifique RLS e `company_id`

### Problema 4: Company ID Incorreto
**Sintoma:** Mensagens com `company_id` diferente do usuário
**Solução:** Atualize `company_id` das mensagens/conversas

