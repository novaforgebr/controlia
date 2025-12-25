# Resumo: Mensagens do Telegram não aparecem no Controlia

## 🎯 Problema Relatado

> "Quando uma mensagem é enviada do Telegram, ela não está aparecendo no Controlia, está indo direto para o n8n."

## ✅ Boa Notícia

**O código do Controlia está CORRETO!** 

O webhook do Telegram (`app/api/webhooks/telegram/route.ts`) **SEMPRE salva a mensagem no Controlia ANTES de enviar para o n8n**.

O fluxo implementado é:
1. ✅ **PASSO 1:** Telegram → Controlia (mensagem é SALVA no banco)
2. ✅ **PASSO 2:** Controlia busca automações
3. ✅ **PASSO 3:** Controlia envia para n8n (mensagem JÁ está salva)

## 🔍 Possíveis Causas

### Causa 1: Webhook do Telegram configurado incorretamente ⚠️ **MAIS PROVÁVEL**

**Problema:** O webhook do Telegram pode estar apontando **direto para o n8n** ao invés do Controlia.

**Como verificar:**
```bash
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

**Se a URL estiver assim, está ERRADO:**
```
https://n8n.exemplo.com/webhook/xxx  ❌
```

**Deveria estar assim:**
```
https://seu-dominio.com/api/webhooks/telegram  ✅
```

**Como corrigir:**
```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-dominio.com/api/webhooks/telegram"}'
```

### Causa 2: Problema de RLS (Row Level Security)

**Problema:** A mensagem está sendo salva, mas o RLS está bloqueando a visualização.

**Solução:** Executar script de correção:
```sql
-- Executar: supabase/corrigir-rls-messages-para-leitura.sql
```

### Causa 3: company_id inconsistente

**Problema:** A mensagem está sendo salva com `company_id` diferente ou NULL.

**Solução:** Executar script de correção:
```sql
-- Executar: supabase/solucao-mensagens-inbound-nao-aparecem.sql
```

## 🧪 Diagnóstico Rápido

### 1. Verificar se mensagem está no banco

Execute no SQL Editor do Supabase:

```sql
SELECT 
  m.id,
  m.content,
  m.direction,
  m.sender_type,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
ORDER BY m.created_at DESC
LIMIT 10;
```

**Se encontrar mensagens:**
- ✅ Mensagem está sendo salva
- ❌ Problema é de RLS ou visualização

**Se NÃO encontrar mensagens:**
- ❌ Webhook não está sendo chamado
- ❌ Webhook está apontando para lugar errado

### 2. Verificar logs do servidor

Procure por estas mensagens nos logs:

- `📥 Webhook Telegram recebido` - Webhook foi chamado
- `✅ Mensagem criada com sucesso` - Mensagem foi salva
- `✅ PASSO 1 CONCLUÍDO: Mensagem salva no Controlia` - Confirmação
- `📤 PASSO 3: PREPARANDO envio para n8n` - Envio para n8n

## 🛠️ Ações Imediatas

### 1. Verificar configuração do webhook (PRIORIDADE ALTA)

```bash
# Verificar webhook atual
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"

# Se estiver errado, corrigir:
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-dominio.com/api/webhooks/telegram"}'
```

### 2. Executar scripts de correção RLS

No SQL Editor do Supabase, execute:
1. `supabase/corrigir-rls-messages-para-leitura.sql`
2. `supabase/solucao-mensagens-inbound-nao-aparecem.sql`

### 3. Testar novamente

1. Enviar nova mensagem do Telegram
2. Verificar se aparece no Controlia (`/conversations`)
3. Verificar logs do servidor
4. Verificar banco de dados (query acima)

## 📚 Documentação Completa

- **Configuração do Webhook:** `docs/CONFIGURACAO_WEBHOOK_TELEGRAM.md`
- **Diagnóstico Detalhado:** `docs/DIAGNOSTICO_MENSAGENS_TELEGRAM.md`
- **Validação do Fluxo:** `docs/VALIDACAO_FLUXO_TELEGRAM.md`

## ✅ Resultado Esperado

Após corrigir:

1. ✅ Mensagem do Telegram → Controlia (salva no banco)
2. ✅ Mensagem aparece na interface `/conversations`
3. ✅ Controlia envia para n8n (processamento adicional)
4. ✅ n8n retorna resposta → Controlia
5. ✅ Controlia envia resposta para Telegram

**A mensagem DEVE aparecer no Controlia ANTES de ser enviada para o n8n!**

