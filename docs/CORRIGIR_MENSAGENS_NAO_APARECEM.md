# 🔧 Corrigir: Mensagens do Contato Não Aparecem

## 🔍 Problema

As mensagens do contato não aparecem na conversa após as mudanças.

## ✅ Passos para Diagnosticar

### Passo 1: Verificar se Mensagens Estão Sendo Salvas

Execute o script `supabase/diagnosticar-mensagens-nao-aparecem.sql`:

**Verifique:**
- ✅ Há mensagens inbound recentes no banco?
- ✅ As mensagens têm `company_id` configurado?
- ✅ O `company_id` das mensagens corresponde ao `company_id` do usuário logado?

### Passo 2: Verificar Logs da Vercel

Após enviar uma mensagem no Telegram, verifique os logs da Vercel:

**Logs esperados:**
```
📥 Webhook Telegram recebido: ...
📨 Processando mensagem do Telegram: ...
✅ Contato encontrado/criado: ...
✅ Conversa encontrada/criada: ...
✅ Mensagem criada com sucesso: ...
```

**Se NÃO aparecer `📥 Webhook Telegram recebido:`:**
- ❌ O Telegram não está enviando para o Controlia
- ✅ Verifique o webhook do Telegram: `curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"`

**Se aparecer mas NÃO aparecer `✅ Mensagem criada com sucesso:`:**
- ❌ Há erro ao salvar a mensagem
- ✅ Verifique os logs de erro na Vercel

### Passo 3: Verificar RLS (Row Level Security)

Execute:

```sql
-- Verificar políticas RLS para messages
SELECT 
  polname AS policy_name,
  polcmd AS cmd,
  pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;
```

**Verifique:**
- ✅ Há política que permite `SELECT` para usuários autenticados?
- ✅ A política permite ler mensagens com `company_id` da empresa do usuário?

### Passo 4: Verificar Company ID

Execute:

```sql
-- Verificar company_id das mensagens vs company_id do usuário
SELECT 
  m.id,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  m.direction,
  m.sender_type,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 10;
```

**Verifique:**
- ✅ O `company_id` das mensagens corresponde ao `company_id` da empresa do usuário logado?
- ✅ Se não corresponder, atualize o `company_id` das mensagens

## 🎯 Soluções

### Solução 1: Verificar Webhook do Telegram

Execute:

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

**Se a URL não for `https://controliaa.vercel.app/api/webhooks/telegram`:**

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook?url=https://controliaa.vercel.app/api/webhooks/telegram"
```

### Solução 2: Corrigir Company ID das Mensagens

Se as mensagens têm `company_id` diferente do usuário logado:

```sql
-- Substitua COMPANY_ID pelo ID correto da empresa
UPDATE messages
SET company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
WHERE company_id IS NULL
  OR company_id != 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND created_at > NOW() - INTERVAL '1 hour';
```

### Solução 3: Verificar RLS

Se RLS estiver bloqueando:

```sql
-- Verificar se RLS está habilitado
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'messages';

-- Se RLS estiver bloqueando, verifique as políticas
SELECT 
  polname,
  polcmd,
  pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy
WHERE polrelid::regclass::text = 'messages';
```

## 📋 Checklist

- [ ] Webhook do Telegram configurado corretamente
- [ ] Mensagens sendo salvas no banco (SQL)
- [ ] Mensagens têm `company_id` correto
- [ ] RLS permite ler mensagens
- [ ] Logs da Vercel mostram `✅ Mensagem criada com sucesso`
- [ ] UI carrega mensagens corretamente

## ⚠️ Problemas Comuns

### Problema 1: Webhook Não Configurado
**Sintoma:** Logs não mostram `📥 Webhook Telegram recebido`
**Solução:** Reconfigure o webhook do Telegram

### Problema 2: Company ID Incorreto
**Sintoma:** Mensagens no banco mas não aparecem na UI
**Solução:** Atualize o `company_id` das mensagens

### Problema 3: RLS Bloqueando
**Sintoma:** Mensagens no banco mas erro ao carregar na UI
**Solução:** Verifique e ajuste as políticas RLS

