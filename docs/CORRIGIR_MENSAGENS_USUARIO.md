# 🔧 Corrigir: Mensagens do Usuário Não Aparecem

## ✅ Correções Aplicadas

### 1. Erro de Build Corrigido
- ✅ Aspas duplas escapadas em `IntegrationSettings.tsx`
- ✅ Build deve funcionar agora

### 2. Código de Mensagens Verificado
- ✅ O código carrega todas as mensagens sem filtrar
- ✅ Mensagens inbound devem aparecer normalmente

## 🔍 Diagnóstico: Por Que Mensagens Não Aparecem?

### Passo 1: Verificar se Mensagens Estão no Banco

Execute no **Supabase SQL Editor**:

```sql
-- Execute: supabase/verificar-mensagens-usuario.sql
```

Este script verifica:
- ✅ Se há mensagens inbound recentes
- ✅ Se as mensagens têm `direction = 'inbound'` e `sender_type = 'human'`
- ✅ Se há problemas com `company_id` NULL

### Passo 2: Verificar Logs da Vercel

Nos logs da Vercel, procure por:

```
✅ Mensagem criada com sucesso: [message_id] Content: [conteúdo]
```

**Se aparecer:**
- ✅ Mensagem foi criada no banco
- ❌ Problema pode ser na UI (RLS ou real-time)

**Se NÃO aparecer:**
- ❌ Mensagem não está sendo criada
- ❌ Verifique erros anteriores nos logs

### Passo 3: Verificar RLS (Row Level Security)

As mensagens podem estar sendo criadas, mas não aparecem por causa de RLS.

Execute no **Supabase SQL Editor**:

```sql
-- Verificar políticas RLS para messages
SELECT 
  polname AS policy_name,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policy
WHERE polrelid::regclass::text = 'messages';
```

**Se houver políticas muito restritivas:**
- As mensagens podem estar sendo criadas com `company_id` NULL
- Ou o usuário logado não tem acesso à empresa das mensagens

### Passo 4: Verificar Real-Time Subscription

O componente `ConversationDetailView` usa Supabase Realtime para atualizar mensagens automaticamente.

**Verifique:**
1. Se o Supabase Realtime está habilitado
2. Se há erros no console do navegador
3. Se a subscription está ativa

**Teste manual:**
1. Abra a conversa no Controlia
2. Abra o Console do navegador (F12)
3. Envie uma mensagem no Telegram
4. Veja se há erros no console

## 🔧 Soluções Possíveis

### Solução 1: Recarregar Mensagens Manualmente

No componente, há um botão ou função para recarregar. Tente:
1. Fechar e reabrir a conversa
2. Recarregar a página
3. Verificar se as mensagens aparecem

### Solução 2: Verificar Company ID

Se as mensagens têm `company_id` diferente do usuário logado:

```sql
-- Verificar company_id das mensagens vs usuário
SELECT 
  m.id,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  cu.company_id as user_company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
CROSS JOIN (
  SELECT company_id FROM company_users 
  WHERE user_id = auth.uid() 
  LIMIT 1
) cu
WHERE m.created_at > NOW() - INTERVAL '1 hour'
LIMIT 10;
```

**Se os `company_id` forem diferentes:**
- Atualize as mensagens para usar o `company_id` correto

### Solução 3: Verificar Filtros na Query

O código atual não filtra mensagens, mas verifique se há algum filtro oculto:

```typescript
// Em ConversationDetailView.tsx, linha 101-106
const { data, error } = await supabase
  .from('messages')
  .select('*, user_profiles:sender_id(full_name)')
  .eq('conversation_id', conversation.id)
  .order('created_at', { ascending: true })
  .limit(100)
```

**Esta query deve retornar todas as mensagens**, incluindo inbound.

## 🧪 Teste Rápido

1. **Envie uma mensagem no Telegram**
2. **Execute o SQL de verificação** (`supabase/verificar-mensagens-usuario.sql`)
3. **Verifique se a mensagem aparece no resultado**
4. **Se aparecer no SQL mas não na UI:**
   - Problema é RLS ou real-time
5. **Se NÃO aparecer no SQL:**
   - Problema é na criação da mensagem

## 📋 Checklist de Verificação

- [ ] Erro de build corrigido (deploy feito)
- [ ] Mensagens aparecem no SQL (`verificar-mensagens-usuario.sql`)
- [ ] Logs da Vercel mostram "✅ Mensagem criada com sucesso"
- [ ] `company_id` das mensagens corresponde ao usuário logado
- [ ] Real-time subscription está ativa (sem erros no console)
- [ ] Recarregar a página mostra as mensagens

## 🎯 Próximos Passos

1. **Execute o script SQL** para verificar se as mensagens estão no banco
2. **Verifique os logs da Vercel** para ver se há erros
3. **Teste recarregando a página** da conversa
4. **Envie os resultados** para análise mais detalhada

