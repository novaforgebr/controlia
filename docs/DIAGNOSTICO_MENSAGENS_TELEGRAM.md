# Diagnóstico: Mensagens do Telegram não aparecem no Controlia

## 🔍 Problema Relatado

Quando uma mensagem é enviada do Telegram, ela não aparece no Controlia - está indo direto para o n8n.

## ✅ Fluxo Correto Implementado

O código do webhook Telegram (`app/api/webhooks/telegram/route.ts`) está implementado corretamente:

```
1. Telegram envia mensagem → /api/webhooks/telegram
2. ✅ Controlia SALVA mensagem no banco (PASSO 1)
3. ✅ Controlia busca automações (PASSO 2)
4. ✅ Controlia envia para n8n (PASSO 3)
5. n8n processa
6. n8n retorna → /api/webhooks/n8n/channel-response
7. Controlia salva resposta
8. Controlia envia para Telegram
```

**A mensagem É SALVA ANTES de enviar para n8n!**

## 🔧 Possíveis Causas

### 1. Webhook do Telegram configurado incorretamente

**PROBLEMA:** O webhook do Telegram pode estar apontando direto para o n8n ao invés do Controlia.

**SOLUÇÃO:** Verificar e corrigir a configuração do webhook no Telegram.

#### Como verificar:

```bash
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

**Resposta esperada:**
```json
{
  "ok": true,
  "result": {
    "url": "https://seu-dominio.com/api/webhooks/telegram",
    ...
  }
}
```

**Se a URL estiver apontando para n8n:**
```json
{
  "ok": true,
  "result": {
    "url": "https://n8n.exemplo.com/webhook/xxx",  // ❌ ERRADO!
    ...
  }
}
```

#### Como corrigir:

```bash
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-dominio.com/api/webhooks/telegram"}'
```

### 2. Problema de RLS (Row Level Security)

**PROBLEMA:** A mensagem está sendo salva, mas o RLS está bloqueando a visualização.

**SOLUÇÃO:** Executar scripts de correção RLS.

#### Scripts disponíveis:

1. `supabase/corrigir-rls-messages-para-leitura.sql` - Corrige políticas RLS
2. `supabase/solucao-mensagens-inbound-nao-aparecem.sql` - Garante consistência de company_id

### 3. Problema de company_id inconsistente

**PROBLEMA:** A mensagem está sendo salva com `company_id` diferente ou NULL, impedindo a visualização.

**SOLUÇÃO:** Executar script de correção.

#### Verificar:

```sql
-- Verificar mensagens com company_id inconsistente
SELECT 
  m.id,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  CASE 
    WHEN m.company_id = c.company_id THEN '✅ Consistente'
    WHEN m.company_id IS NULL THEN '❌ NULL - precisa corrigir'
    ELSE '❌ Diferente - precisa corrigir'
  END as status
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC;
```

## 🧪 Diagnóstico Passo a Passo

### 1. Verificar se webhook está sendo chamado

**Verificar logs do servidor:**
- Procurar por: `📥 Webhook Telegram recebido`
- Se não encontrar: Webhook não está configurado corretamente

### 2. Verificar se mensagem foi salva

**Verificar logs:**
- Procurar por: `✅ Mensagem criada com sucesso`
- Procurar por: `✅ PASSO 1 CONCLUÍDO: Mensagem salva no Controlia`

**Verificar banco de dados:**
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

### 3. Verificar se mensagem aparece na interface

**Acessar:** `/conversations` ou página de detalhes da conversa

**Se não aparecer:**
- Verificar RLS (executar scripts de correção)
- Verificar se `company_id` está correto
- Verificar se usuário tem acesso à empresa

### 4. Verificar se foi enviado para n8n

**Verificar logs:**
- Procurar por: `📤 PASSO 3: PREPARANDO envio para n8n`
- Procurar por: `✅ Mensagem enviada para n8n com sucesso`

**Verificar banco de dados:**
```sql
SELECT 
  al.id,
  al.automation_id,
  al.status,
  al.started_at,
  al.error_message
FROM automation_logs al
WHERE al.trigger_event = 'new_message'
  AND al.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC
LIMIT 10;
```

## 🛠️ Scripts de Correção

### 1. Garantir RLS correto

```sql
-- Executar: supabase/corrigir-rls-messages-para-leitura.sql
```

### 2. Garantir company_id consistente

```sql
-- Executar: supabase/solucao-mensagens-inbound-nao-aparecem.sql
```

### 3. Verificar mensagens recentes

```sql
-- Executar: supabase/garantir-mensagem-salva-antes-n8n.sql
```

## 📋 Checklist de Validação

- [ ] Webhook do Telegram aponta para `/api/webhooks/telegram` (não para n8n)
- [ ] Logs mostram `✅ Mensagem criada com sucesso`
- [ ] Mensagem aparece no banco de dados (query acima)
- [ ] RLS permite visualização (scripts executados)
- [ ] `company_id` está consistente (scripts executados)
- [ ] Mensagem aparece na interface `/conversations`
- [ ] Logs mostram `📤 PASSO 3: PREPARANDO envio para n8n`
- [ ] Logs mostram envio para n8n bem-sucedido

## 🎯 Próximos Passos

1. **Verificar configuração do webhook no Telegram**
2. **Executar scripts de correção RLS e company_id**
3. **Enviar nova mensagem de teste**
4. **Verificar logs e banco de dados**
5. **Confirmar que mensagem aparece na interface**

