# 🔍 Diagnosticar: Mensagens do Lead Não Estão Sendo Salvas

## 🔍 Problema

As mensagens do lead/contato não estão sendo salvas no banco de dados, mesmo que o envio ao n8n esteja funcionando.

## ✅ Correções Aplicadas

1. **Logs melhorados** - Agora mostra todos os detalhes da tentativa de inserção
2. **Validações adicionadas** - Verifica se contato e conversa existem antes de criar mensagem
3. **Tratamento de erros melhorado** - Não retorna 500 para Telegram não reenviar, mas loga tudo

## 🔍 Como Diagnosticar

### Passo 1: Verificar Logs da Vercel

Nos logs da Vercel, procure por estas mensagens quando enviar uma mensagem no Telegram:

**Se aparecer:**
```
💾 Tentando inserir mensagem: {...}
📋 Dados para inserção de mensagem:
   company_id: ...
   conversation_id: ...
   contact_id: ...
   content: ...
```

**E depois:**
```
❌ Erro ao criar mensagem: ...
❌ Código do erro: ...
❌ Mensagem do erro: ...
❌ Detalhes completos: ...
```

**Copie TODOS os detalhes do erro** - isso mostrará exatamente o que está falhando.

### Passo 2: Verificar Erros Comuns

#### Erro 1: RLS Policy Violation
```
Código: 42501
Mensagem: new row violates row-level security policy
```

**Solução:**
- Verificar se o `serviceClient` está sendo usado (já está)
- Verificar políticas RLS da tabela `messages`

#### Erro 2: Foreign Key Violation
```
Código: 23503
Mensagem: insert or update on table "messages" violates foreign key constraint
```

**Solução:**
- Verificar se `company_id`, `conversation_id`, `contact_id` existem
- Verificar se os IDs são válidos

#### Erro 3: Not Null Violation
```
Código: 23502
Mensagem: null value in column "..." violates not-null constraint
```

**Solução:**
- Verificar se todos os campos obrigatórios estão sendo preenchidos
- Verificar se `company_id`, `conversation_id`, `contact_id` não são NULL

### Passo 3: Verificar no Banco de Dados

Execute no **Supabase SQL Editor**:

```sql
-- Verificar se há mensagens sendo criadas (mesmo com erro)
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.content,
  m.created_at,
  m.company_id,
  m.contact_id
FROM messages m
WHERE m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 10;

-- Verificar se contato e conversa existem
SELECT 
  c.id as contact_id,
  c.company_id as contact_company_id,
  c.name as contact_name,
  conv.id as conversation_id,
  conv.company_id as conversation_company_id
FROM contacts c
LEFT JOIN conversations conv ON conv.contact_id = c.id
WHERE c.custom_fields->>'telegram_id' IS NOT NULL
ORDER BY c.created_at DESC
LIMIT 5;
```

### Passo 4: Verificar RLS Policies

Execute no **Supabase SQL Editor**:

```sql
-- Verificar políticas RLS para messages
SELECT 
  polname AS policy_name,
  permissive,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;
```

**Verificar se há política que permite INSERT com service role ou quando company_id IS NULL.**

## 🔧 Soluções Possíveis

### Solução 1: Verificar se Service Role Key Está Configurada

No arquivo `.env` ou variáveis de ambiente da Vercel, verifique:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Se não estiver configurada:**
- Adicione a variável de ambiente na Vercel
- A chave está no Supabase Dashboard > Settings > API > service_role key

### Solução 2: Verificar RLS Policies

Se as políticas RLS estão bloqueando, execute:

```sql
-- Verificar se há política que permite INSERT para service role
-- Se não houver, pode ser necessário ajustar as políticas
```

### Solução 3: Testar Inserção Manual

Execute no **Supabase SQL Editor** (substitua os IDs):

```sql
-- Testar inserção manual de mensagem
INSERT INTO messages (
  company_id,
  conversation_id,
  contact_id,
  content,
  content_type,
  direction,
  sender_type,
  channel_message_id,
  status
) VALUES (
  'cae292bd-2cc7-42b9-9254-779ed011989e',  -- Seu company_id
  'dd17b2bf-6c3f-42b8-bb81-1c85dac8829c',  -- Um conversation_id válido
  '493fcd71-78e2-44d2-82aa-f2a8b13f4566',  -- Um contact_id válido
  'Teste manual',
  'text',
  'inbound',
  'human',
  'test-123',
  'delivered'
)
RETURNING id, created_at;
```

**Se funcionar:**
- ✅ A tabela e RLS estão OK
- ❌ Problema está no código do webhook

**Se não funcionar:**
- ❌ Problema é RLS ou estrutura da tabela

## 📋 Checklist de Verificação

- [ ] Logs da Vercel mostram tentativa de inserção
- [ ] Logs mostram erro específico (código e mensagem)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurada na Vercel
- [ ] Teste manual de inserção funcionou
- [ ] RLS policies permitem INSERT com service role
- [ ] `company_id`, `conversation_id`, `contact_id` são válidos

## 🎯 Próximos Passos

1. **Envie uma mensagem no Telegram**
2. **Copie TODOS os logs da Vercel** (especialmente os erros)
3. **Execute o teste manual de inserção** no SQL
4. **Envie os resultados** para análise

Com os logs detalhados, conseguiremos identificar exatamente o que está falhando!

