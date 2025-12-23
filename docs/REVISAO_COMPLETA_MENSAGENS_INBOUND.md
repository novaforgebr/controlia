# 🔍 Revisão Completa: Mensagens Inbound Não Aparecem

## 🔍 Problema

As mensagens do lead/cliente não estão aparecendo na interface, apenas:
- ✅ Mensagens enviadas pelo operador (você)
- ✅ Mensagens da IA
- ❌ Mensagens do lead (inbound, sender_type: human)

## ✅ Correções Aplicadas

1. **Logs detalhados adicionados** - Agora mostra todo o fluxo de processamento
2. **Verificação de bot** - Ignora mensagens de bots
3. **Validações melhoradas** - Verifica cada etapa antes de continuar
4. **Retry automático** - Tenta novamente sem `created_at` se falhar
5. **Retorno correto** - Retorna 500 se realmente falhar (para Telegram reenviar)

## 🔍 Como Diagnosticar

### Passo 1: Verificar Logs da Vercel

Após fazer deploy, envie uma mensagem no Telegram e verifique os logs:

**Logs esperados (sucesso):**
```
📥 Webhook Telegram recebido: {...}
📨 Processando mensagem do Telegram: { message_id: ..., from_id: ..., text: ... }
✅ Contato encontrado/criado: [id] Company: [company_id]
✅ Conversa encontrada/criada: [id]
📋 Dados para inserção de mensagem:
   company_id: ...
   conversation_id: ...
   contact_id: ...
   content: ...
   direction: inbound
   sender_type: human
💾 Tentando inserir mensagem: {...}
✅ Mensagem criada com sucesso: [id] Content: ...
✅ Mensagem inbound salva no banco - ID: [id] Direction: inbound Sender: human
✅ Resumo final da mensagem inbound criada:
   - Mensagem ID: ...
   - Direction: inbound
   - Sender Type: human
```

**Se aparecer erro:**
```
❌ Erro ao criar mensagem: ...
❌ Código do erro: ...
🔄 Tentando novamente sem created_at customizado...
```

### Passo 2: Verificar se Mensagem Foi Salva

Execute no **Supabase SQL Editor**:

```sql
-- Verificar mensagens inbound recentes (última hora)
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.content,
  m.created_at,
  c.channel
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 10;
```

**Se retornar vazio:**
- ❌ Mensagem não está sendo salva
- Verifique os logs da Vercel para ver o erro

**Se retornar mensagens:**
- ✅ Mensagens estão sendo salvas
- ❌ Problema pode ser na UI (filtros, RLS na leitura)

### Passo 3: Verificar RLS na Leitura

O problema pode ser que as mensagens estão sendo salvas, mas não aparecem na UI por causa de RLS na leitura.

Execute no **Supabase SQL Editor**:

```sql
-- Verificar políticas RLS para SELECT em messages
SELECT 
  polname AS policy_name,
  polcmd AS cmd,
  pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
  AND polcmd = 'SELECT'
ORDER BY polname;
```

**Verificar se há política que permite SELECT para:**
- Usuários autenticados da empresa
- Mensagens com `company_id` correspondente

### Passo 4: Verificar Filtros na UI

O componente `ConversationDetailView` pode estar filtrando mensagens incorretamente.

**Verificar:**
- A query não filtra por `direction` ou `sender_type`
- A query carrega todas as mensagens da conversa

## 🔧 Possíveis Causas e Soluções

### Causa 1: Mensagem Não Está Sendo Salva

**Sintomas:**
- Logs mostram erro ao criar mensagem
- SQL não retorna mensagens inbound recentes

**Solução:**
- Verificar logs da Vercel para erro específico
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Verificar se todos os campos obrigatórios estão preenchidos

### Causa 2: Mensagem Está Sendo Salva, Mas Não Aparece na UI

**Sintomas:**
- SQL retorna mensagens inbound
- UI não mostra essas mensagens

**Solução:**
- Verificar RLS policies para SELECT
- Verificar se `company_id` das mensagens corresponde ao usuário logado
- Verificar se real-time subscription está funcionando

### Causa 3: Mensagem de Bot Está Sendo Processada

**Sintomas:**
- Mensagens de bots podem estar sendo processadas incorretamente

**Solução:**
- Já adicionado: ignora mensagens de bots (`is_bot === true`)

## 📋 Checklist de Verificação

- [ ] Deploy feito (código atualizado)
- [ ] Mensagem enviada no Telegram
- [ ] Logs da Vercel verificados (procurar por "✅ Mensagem inbound salva no banco")
- [ ] SQL executado para verificar se mensagem foi salva
- [ ] Se mensagem foi salva mas não aparece: verificar RLS para SELECT
- [ ] Se mensagem não foi salva: verificar logs de erro

## 🎯 Próximos Passos

1. **Faça deploy das correções**
2. **Envie uma mensagem no Telegram**
3. **Verifique os logs da Vercel** - procure por "✅ Mensagem inbound salva no banco"
4. **Execute o SQL** para verificar se a mensagem foi salva
5. **Se salva mas não aparece:** Verifique RLS para SELECT
6. **Se não salva:** Copie os logs de erro completos

Com os logs detalhados, conseguiremos identificar exatamente onde está o problema!

