# 🔍 Diagnosticar: Mensagens Não Estão Sendo Enviadas para n8n

## 🔍 Problema

As mensagens do lead aparecem na conversa, mas **não são enviadas para o n8n**, então a IA não responde.

## ✅ Passos para Diagnosticar

### Passo 1: Verificar Automações no Banco de Dados

Execute o script SQL `supabase/verificar-automacoes-ativas.sql` no Supabase SQL Editor.

**Verifique:**
- ✅ Existe uma automação com `trigger_event = 'new_message'`?
- ✅ A automação está `is_active = true`?
- ✅ A automação está `is_paused = false`?
- ✅ A automação tem `n8n_webhook_url` configurada?
- ✅ O `company_id` da automação corresponde ao `company_id` do contato?

### Passo 2: Verificar Logs da Vercel

Após enviar uma mensagem no Telegram, verifique os logs da Vercel:

**Logs esperados:**
```
📥 Webhook Telegram recebido: ...
📨 Processando mensagem do Telegram: ...
✅ Mensagem inbound salva no banco - ID: ...
🔍 Buscando automações para company_id: ...
🔍 Automações encontradas: 1 (ou 0)
```

**Se aparecer `🔍 Automações encontradas: 0`:**
- ❌ Não há automação configurada ou ativa
- ❌ O `company_id` não corresponde
- ❌ A automação está pausada ou inativa

**Se aparecer `🔍 Automações encontradas: 1` mas não aparecer `📤 Enviando para n8n:`:**
- ❌ A automação não tem `n8n_webhook_url` configurada

### Passo 3: Verificar Configuração da Automação

Execute no Supabase SQL Editor:

```sql
-- Substitua COMPANY_ID pelo ID da sua empresa
SELECT 
  id,
  name,
  trigger_event,
  n8n_webhook_url,
  is_active,
  is_paused,
  company_id
FROM automations
WHERE company_id = 'SEU_COMPANY_ID_AQUI'
  AND trigger_event = 'new_message';
```

**Verifique:**
- ✅ `n8n_webhook_url` não é NULL e não está vazio
- ✅ `is_active = true`
- ✅ `is_paused = false`
- ✅ `company_id` corresponde ao ID da empresa do contato

### Passo 4: Criar/Corrigir Automação

Se não houver automação ou se estiver incorreta, execute:

```sql
-- Substitua os valores abaixo
INSERT INTO automations (
  company_id,
  name,
  description,
  trigger_event,
  n8n_webhook_url,
  n8n_workflow_id,
  is_active,
  is_paused
) VALUES (
  'SEU_COMPANY_ID_AQUI',  -- ID da sua empresa
  'Agente IA - Mensagens Recebidas',
  'Encaminha novas mensagens recebidas para n8n para processamento de IA',
  'new_message',
  'SUA_URL_DO_N8N_AQUI',  -- Ex: https://controlia.up.railway.app/webhook/...
  'SEU_WORKFLOW_ID_AQUI', -- Ex: EW96u6Ji0AqtS7up
  TRUE,
  FALSE
)
ON CONFLICT (company_id, name) DO UPDATE SET
  n8n_webhook_url = EXCLUDED.n8n_webhook_url,
  n8n_workflow_id = EXCLUDED.n8n_workflow_id,
  is_active = EXCLUDED.is_active,
  is_paused = EXCLUDED.is_paused,
  updated_at = NOW();
```

### Passo 5: Verificar Logs de Automação

Execute:

```sql
SELECT 
  id,
  automation_id,
  trigger_event,
  status,
  error_message,
  started_at
FROM automation_logs
WHERE started_at > NOW() - INTERVAL '1 hour'
ORDER BY started_at DESC
LIMIT 10;
```

**Se houver erros:**
- Verifique a `error_message` para entender o problema
- Verifique se o `n8n_webhook_url` está correto
- Verifique se o secret está configurado corretamente

## 🎯 Solução Rápida

1. **Execute o script SQL** `supabase/verificar-automacoes-ativas.sql`
2. **Verifique se há uma automação ativa** com `trigger_event = 'new_message'`
3. **Se não houver, crie uma** usando o SQL acima
4. **Envie uma nova mensagem no Telegram**
5. **Verifique os logs da Vercel** - deve aparecer `📤 Enviando para n8n:`

## 📋 Checklist

- [ ] Automação existe no banco de dados
- [ ] Automação tem `trigger_event = 'new_message'`
- [ ] Automação está `is_active = true`
- [ ] Automação está `is_paused = false`
- [ ] Automação tem `n8n_webhook_url` configurada
- [ ] O `company_id` da automação corresponde ao `company_id` do contato
- [ ] Logs da Vercel mostram `🔍 Automações encontradas: 1` (ou mais)
- [ ] Logs da Vercel mostram `📤 Enviando para n8n:`

## ⚠️ Problemas Comuns

### Problema 1: Automação não encontrada
**Causa:** `company_id` não corresponde ou automação não existe
**Solução:** Verifique o `company_id` do contato e crie/ajuste a automação

### Problema 2: Automação inativa ou pausada
**Causa:** `is_active = false` ou `is_paused = true`
**Solução:** Ative a automação no banco de dados

### Problema 3: URL do webhook não configurada
**Causa:** `n8n_webhook_url` é NULL ou vazio
**Solução:** Configure a URL do webhook do n8n na automação

### Problema 4: Secret não configurado
**Causa:** O n8n está rejeitando por falta de autenticação
**Solução:** Configure `n8n_webhook_secret` nas settings da empresa

