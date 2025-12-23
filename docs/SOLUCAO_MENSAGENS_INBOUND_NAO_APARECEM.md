# 🔧 Solução: Mensagens Inbound Não Aparecem na Plataforma

## 📋 Problema Identificado

As mensagens do contato estão sendo:
- ✅ Enviadas ao n8n corretamente
- ✅ Processadas pela IA
- ✅ Respostas da IA aparecem na conversa
- ✅ Mensagens enviadas pela plataforma aparecem e são enviadas
- ❌ **Mensagens do contato NÃO aparecem na plataforma**

## 🔍 Causa Raiz

O problema é uma **inconsistência de `company_id`** entre mensagens e conversas:

1. **Mensagens inbound** podem estar sendo salvas com `company_id` diferente do `company_id` da conversa
2. **Política RLS** bloqueia a leitura quando `user_belongs_to_company(company_id)` retorna `false`
3. **Frontend** não consegue ler mensagens que não pertencem à empresa do usuário logado

## ✅ Solução Implementada

### 1. Script SQL de Correção

Execute o script `supabase/solucao-mensagens-inbound-nao-aparecem.sql` que:

- ✅ **Corrige mensagens existentes:** Atualiza `company_id` das mensagens inbound para corresponder ao `company_id` da conversa
- ✅ **Cria trigger:** Garante que futuras mensagens sempre tenham `company_id` consistente
- ✅ **Verifica políticas RLS:** Garante que a política de SELECT está correta

### 2. Correção no Código do Webhook

O código do webhook foi ajustado para:

- ✅ **Selecionar `company_id` da conversa:** Agora busca `company_id` junto com `id` da conversa
- ✅ **Priorizar `company_id` da conversa:** Usa `conversation.company_id` antes de `contact.company_id`
- ✅ **Logs detalhados:** Adiciona logs para debug de `company_id`

## 📝 Passos para Resolver

### Passo 1: Executar Script SQL

1. Acesse o **Supabase SQL Editor**
2. Execute o script: `supabase/solucao-mensagens-inbound-nao-aparecem.sql`
3. Verifique o resultado (deve mostrar mensagens corrigidas)

### Passo 2: Verificar Mensagens

Execute este script para verificar se as mensagens estão consistentes:

```sql
-- Verificar mensagens inbound recentes
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  CASE 
    WHEN m.company_id = c.company_id THEN '✅ Consistente'
    WHEN m.company_id IS NULL AND c.company_id IS NULL THEN '⚠️ Ambos NULL'
    WHEN m.company_id IS NULL THEN '❌ Mensagem NULL, conversa tem company_id'
    ELSE '❌ Diferente'
  END as status_consistencia,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '2 hours'
ORDER BY m.created_at DESC
LIMIT 20;
```

### Passo 3: Testar

1. **Envie uma mensagem do Telegram** para o bot
2. **Verifique os logs da Vercel** para ver se a mensagem foi salva corretamente
3. **Verifique na plataforma** se a mensagem aparece na conversa
4. **Verifique o real-time** - a mensagem deve aparecer automaticamente sem refresh

## 🔍 Diagnóstico Adicional

Se as mensagens ainda não aparecerem após a correção, execute:

```sql
-- Script de diagnóstico completo
-- Execute: supabase/diagnosticar-mensagens-inbound-nao-aparecem.sql
```

Este script verifica:
- Mensagens inbound recentes e seus `company_id`
- Inconsistências de `company_id`
- Políticas RLS atuais
- Função `user_belongs_to_company`
- Mensagens por `company_id`

## 🎯 Resultado Esperado

Após aplicar a solução:

1. ✅ **Mensagens inbound** são salvas com `company_id` igual ao da conversa
2. ✅ **Frontend** consegue ler mensagens via RLS
3. ✅ **Real-time** funciona corretamente
4. ✅ **Mensagens aparecem automaticamente** na conversa

## 🚨 Se Ainda Não Funcionar

Se após aplicar a solução as mensagens ainda não aparecerem:

1. **Verifique os logs da Vercel** para erros no webhook
2. **Verifique o console do navegador** para erros de RLS
3. **Execute o script de diagnóstico** para identificar o problema específico
4. **Verifique se o usuário pertence à empresa** correta:
   ```sql
   SELECT * FROM company_users 
   WHERE user_id = auth.uid() 
   AND company_id = 'SEU_COMPANY_ID';
   ```

## 📚 Arquivos Modificados

- ✅ `supabase/solucao-mensagens-inbound-nao-aparecem.sql` - Script de correção
- ✅ `supabase/diagnosticar-mensagens-inbound-nao-aparecem.sql` - Script de diagnóstico
- ✅ `app/api/webhooks/telegram/route.ts` - Correção no código do webhook

