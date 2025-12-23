# ✅ Solução: Mensagens Inbound Não Aparecem

## 🎯 Problema Resolvido

As mensagens do contato não apareciam na plataforma porque:
- ❌ Mensagens eram salvas com `company_id` inconsistente
- ❌ Política RLS bloqueava a leitura pelo frontend
- ❌ Real-time não funcionava corretamente

## 🔧 Soluções Aplicadas

### 1. Script SQL de Correção ✅

**Arquivo:** `supabase/solucao-mensagens-inbound-nao-aparecem.sql`

Este script:
- ✅ Corrige mensagens existentes com `company_id` inconsistente
- ✅ Cria trigger para garantir consistência futura
- ✅ Verifica e ajusta políticas RLS

**Como executar:**
1. Acesse o Supabase SQL Editor
2. Cole e execute o conteúdo do arquivo
3. Verifique o resultado

### 2. Correção no Código do Webhook ✅

**Arquivo:** `app/api/webhooks/telegram/route.ts`

**Mudanças:**
- ✅ Agora seleciona `company_id` da conversa ao buscar
- ✅ Garante que mensagens sempre tenham `company_id` correto
- ✅ Adiciona logs detalhados para debug

## 📋 Passos para Aplicar a Solução

### Passo 1: Executar Script SQL (OBRIGATÓRIO)

```sql
-- Execute no Supabase SQL Editor:
-- Arquivo: supabase/solucao-mensagens-inbound-nao-aparecem.sql
```

### Passo 2: Fazer Deploy do Código Atualizado

O código já foi atualizado. Se você estiver usando Vercel:
- O deploy automático deve acontecer
- Ou faça push das mudanças

### Passo 3: Testar

1. Envie uma mensagem do Telegram para o bot
2. Verifique se a mensagem aparece na plataforma
3. Verifique os logs da Vercel para confirmar que foi salva corretamente

## 🔍 Verificação

Execute este SQL para verificar se está funcionando:

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
    ELSE '❌ Inconsistente'
  END as status,
  LEFT(m.content, 50) as content_preview,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 10;
```

Todas as mensagens devem mostrar `✅ Consistente`.

## 🎯 Resultado Esperado

Após aplicar a solução:

1. ✅ Mensagens inbound são salvas com `company_id` correto
2. ✅ Frontend consegue ler mensagens via RLS
3. ✅ Real-time funciona automaticamente
4. ✅ Mensagens aparecem na conversa sem refresh

## 🚨 Se Ainda Não Funcionar

1. **Verifique os logs da Vercel** - Procure por erros no webhook
2. **Verifique o console do navegador** - Procure por erros de RLS
3. **Execute o script de diagnóstico:**
   ```sql
   -- Arquivo: supabase/diagnosticar-mensagens-inbound-nao-aparecem.sql
   ```
4. **Verifique se o usuário pertence à empresa:**
   ```sql
   SELECT * FROM company_users 
   WHERE user_id = auth.uid() 
   AND is_active = true;
   ```

## 📚 Arquivos Modificados

- ✅ `supabase/solucao-mensagens-inbound-nao-aparecem.sql` - Script de correção
- ✅ `supabase/diagnosticar-mensagens-inbound-nao-aparecem.sql` - Script de diagnóstico
- ✅ `app/api/webhooks/telegram/route.ts` - Correção no código
- ✅ `docs/SOLUCAO_MENSAGENS_INBOUND_NAO_APARECEM.md` - Documentação completa

