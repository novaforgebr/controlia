# Correção: Mensagens do Telegram não aparecem no Controlia

## 🔍 Problema Relatado

Mensagens do Telegram estão sendo enviadas direto para o n8n e não aparecem no Controlia. Apenas mensagens da IA aparecem.

## ✅ Correções Implementadas

### 1. Validações Críticas Adicionadas

O código agora inclui validações para garantir que a mensagem foi salva corretamente:

- ✅ Verifica se mensagem pode ser lida após salvar
- ✅ Confirma company_id, conversation_id, contact_id
- ✅ Valida direction e sender_type
- ✅ Validação final antes de retornar sucesso

### 2. Logs Detalhados

Logs adicionados para facilitar diagnóstico:

```
✅ VALIDAÇÃO: Mensagem salva com company_id: xxx
✅ VALIDAÇÃO: Mensagem confirmada no banco - pode ser lida
✅ VALIDAÇÃO FINAL: Mensagem confirmada e pode ser consultada
❌ ERRO CRÍTICO: Mensagem não pode ser lida após salvar!
```

## 🔧 Diagnóstico

### 1. Verificar Configuração do Webhook do Telegram

**CRÍTICO:** O webhook do Telegram DEVE apontar para o Controlia, NÃO para o n8n!

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

**Deveria estar:**
```
https://controliaa.vercel.app/api/webhooks/telegram  ✅
```

**NÃO deveria estar:**
```
https://controlia.up.railway.app/webhook/xxx  ❌ (n8n)
```

**Se estiver errado, corrigir:**
```bash
curl -X POST "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://controliaa.vercel.app/api/webhooks/telegram"}'
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

Após enviar uma mensagem do Telegram, procure nos logs:

**Se a mensagem foi salva:**
- `✅ Mensagem criada com sucesso`
- `✅ PASSO 1 CONCLUÍDO: Mensagem salva no Controlia`
- `✅ VALIDAÇÃO: Mensagem confirmada no banco`

**Se houver erro:**
- `❌ ERRO CRÍTICO: Mensagem não pode ser lida após salvar`
- `❌ Erro ao criar mensagem`

### 4. Verificar Banco de Dados

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
LIMIT 10;
```

**Se encontrar mensagens:**
- ✅ Mensagem foi salva
- ❌ Problema é de RLS ou visualização

**Se NÃO encontrar mensagens:**
- ❌ Webhook não está sendo chamado
- ❌ Webhook está apontando para lugar errado

### 5. Verificar RLS (Row Level Security)

Se as mensagens estão sendo salvas mas não aparecem na interface, execute:

```sql
-- Ver arquivo: supabase/corrigir-rls-messages-para-leitura.sql
```

## 🧪 Teste Passo a Passo

### 1. Verificar Webhook do Telegram

```bash
curl "https://api.telegram.org/bot8464813405:AAFVQLH_CCYMXgnghmVbvwtPgjOwFuIEGlg/getWebhookInfo"
```

### 2. Enviar Mensagem de Teste

Envie uma mensagem do Telegram para o bot.

### 3. Verificar Logs da Vercel

Procure por:
- `📥 Webhook Telegram recebido`
- `✅ Mensagem criada com sucesso`
- `✅ VALIDAÇÃO: Mensagem confirmada no banco`

### 4. Verificar Banco de Dados

Execute a query acima para verificar se a mensagem foi salva.

### 5. Verificar Interface

Acesse `/conversations` e verifique se a mensagem aparece.

## 🛠️ Soluções

### Se o webhook estiver apontando para o n8n:

1. Corrigir webhook do Telegram (comando acima)
2. Aguardar alguns minutos
3. Enviar nova mensagem de teste

### Se as mensagens estão sendo salvas mas não aparecem:

1. Executar script de correção RLS
2. Verificar se company_id está correto
3. Verificar se usuário tem acesso à empresa

### Se as mensagens não estão sendo salvas:

1. Verificar logs da Vercel para erros
2. Verificar se há problemas de RLS impedindo inserção
3. Verificar se company_id está sendo passado corretamente

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

1. **Verificar configuração do webhook no Telegram** (PRIORIDADE ALTA)
2. **Executar script de diagnóstico SQL**
3. **Verificar logs da Vercel**
4. **Executar scripts de correção RLS se necessário**
5. **Testar novamente enviando mensagem do Telegram**

