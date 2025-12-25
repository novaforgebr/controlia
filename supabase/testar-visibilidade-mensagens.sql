-- ============================================
-- TESTAR: Visibilidade de Mensagens
-- ============================================
-- Execute este script para verificar se as mensagens
-- podem ser lidas pelo usuário autenticado
-- ============================================

-- 1. Verificar mensagens recentes
SELECT 
  m.id,
  m.content,
  m.direction,
  m.sender_type,
  m.company_id,
  m.conversation_id,
  m.created_at,
  c.company_id as conversation_company_id,
  CASE 
    WHEN m.company_id = c.company_id THEN '✅ Consistente'
    ELSE '❌ Inconsistente'
  END as status
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 10;

-- 2. Verificar se o usuário pode ler mensagens da empresa
-- (Substitua 'cae292bd-2cc7-42b9-9254-779ed011989e' pelo company_id correto)
SELECT 
  COUNT(*) as total_mensagens_visiveis
FROM messages m
WHERE m.company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND m.created_at >= NOW() - INTERVAL '1 hour';

-- 3. Verificar mensagens da conversa específica
SELECT 
  m.id,
  m.content,
  m.direction,
  m.sender_type,
  m.created_at
FROM messages m
WHERE m.conversation_id = 'dd17b2bf-6c3f-42b8-bb81-1c85dac8829c'
  AND m.company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
ORDER BY m.created_at ASC
LIMIT 20;

