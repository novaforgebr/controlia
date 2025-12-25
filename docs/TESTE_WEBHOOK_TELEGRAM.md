# Teste e Diagnóstico: Mensagens do Telegram não aparecem no Controlia

## 🔍 Problema Relatado

Mensagens do Telegram estão sendo enviadas direto para o n8n e não aparecem no Controlia. Apenas mensagens da IA aparecem.

## ✅ Fluxo Correto Implementado

O código do webhook Telegram (`app/api/webhooks/telegram/route.ts`) está implementado corretamente:

```
1. Telegram → Controlia (/api/webhooks/telegram)
2. ✅ Controlia SALVA mensagem no banco (PASSO 1)
3. ✅ Controlia busca automações (PASSO 2)
4. ✅ Controlia envia para n8n (PASSO 3)
5. Controlia retorna sucesso para Telegram
```

**A mensagem É SALVA ANTES de enviar para o n8n!**

## 🔧 Diagnóstico

### 1. Verificar Configuração do Webhook do Telegram

**IMPORTANTE:** O webhook do Telegram DEVE apontar para o Controlia, NÃO para o n8n!

Verificar:
```bash
curl "https://api.telegram.org/bot<SEU_BOT_TOKEN>/getWebhookInfo"
```

**Deveria estar:**
```
https://controliaa.vercel.app/api/webhooks/telegram  ✅
```

**NÃO deveria estar:**
```
https://controlia.up.railway.app/webhook/xxx  ❌ (n8n)
```

### 2. Executar Script de Diagnóstico

Execute no SQL Editor do Supabase:

```sql
-- Ver arquivo: supabase/diagnosticar-mensagens-telegram.sql
```

Este script verifica:
- Mensagens recebidas do Telegram nas últimas 24h
- Distribuição de direções e sender types
- Problemas de company_id
- Logs de automação

### 3. Verificar Logs da Vercel

Procure por estas mensagens nos logs:

**Se a mensagem foi salva:**
- `✅ Mensagem criada com sucesso`
- `✅ PASSO 1 CONCLUÍDO: Mensagem salva no Controlia`
- `✅ VALIDAÇÃO: Mensagem confirmada no banco`

**Se foi enviado para n8n:**
- `📤 ENVIANDO para n8n`
- `✅ Mensagem enviada para n8n com sucesso`

**Se houver erro:**
- `❌ ERRO CRÍTICO: Mensagem não pode ser lida após salvar`
- `❌ Erro ao criar mensagem`

### 4. Verificar RLS (Row Level Security)

Se as mensagens estão sendo salvas mas não aparecem na interface, pode ser problema de RLS.

Execute:
```sql
-- Ver arquivo: supabase/corrigir-rls-messages-para-leitura.sql
```

## 🧪 Teste Passo a Passo

### 1. Enviar Mensagem do Telegram

Envie uma mensagem de teste para o bot.

### 2. Verificar Logs da Vercel

Procure por:
- `📥 Webhook Telegram recebido`
- `✅ Mensagem criada com sucesso`
- `✅ VALIDAÇÃO: Mensagem confirmada no banco`

### 3. Verificar Banco de Dados

Execute:
```sql
SELECT 
  m.id,
  m.content,
  m.direction,
  m.sender_type,
  m.company_id,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
ORDER BY m.created_at DESC
LIMIT 5;
```

**Se encontrar mensagens:**
- ✅ Mensagem foi salva
- ❌ Problema é de RLS ou visualização

**Se NÃO encontrar mensagens:**
- ❌ Webhook não está sendo chamado
- ❌ Webhook está apontando para lugar errado

### 4. Verificar Interface

Acesse `/conversations` e verifique se a mensagem aparece.

**Se não aparecer:**
- Execute script de correção RLS
- Verifique se company_id está correto
- Verifique se usuário tem acesso à empresa

## 🛠️ Correções Implementadas

### 1. Validações Adicionadas

O código agora inclui validações críticas:
- Verifica se mensagem pode ser lida após salvar
- Confirma company_id, conversation_id, contact_id
- Valida direction e sender_type

### 2. Logs Detalhados

Logs adicionados para facilitar diagnóstico:
- `✅ VALIDAÇÃO: Mensagem confirmada no banco`
- `✅ VALIDAÇÃO FINAL: Mensagem confirmada e pode ser consultada`
- `❌ ERRO CRÍTICO: Mensagem não pode ser lida após salvar`

## 📋 Checklist de Validação

- [ ] Webhook do Telegram aponta para `/api/webhooks/telegram` (não para n8n)
- [ ] Logs mostram `✅ Mensagem criada com sucesso`
- [ ] Logs mostram `✅ VALIDAÇÃO: Mensagem confirmada no banco`
- [ ] Mensagem aparece no banco de dados (query acima)
- [ ] RLS permite visualização (scripts executados)
- [ ] Mensagem aparece na interface `/conversations`
- [ ] Logs mostram `📤 ENVIANDO para n8n`
- [ ] Logs mostram envio para n8n bem-sucedido

## 🎯 Próximos Passos

1. **Verificar configuração do webhook no Telegram**
2. **Executar script de diagnóstico SQL**
3. **Verificar logs da Vercel**
4. **Executar scripts de correção RLS se necessário**
5. **Testar novamente enviando mensagem do Telegram**

