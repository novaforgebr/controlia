-- ============================================
-- CORRIGIR: Visibilidade de Mensagens no Controlia
-- ============================================
-- Este script verifica e corrige problemas de RLS que impedem
-- as mensagens de aparecerem na interface do Controlia
-- ============================================

-- 1. Verificar se a função user_belongs_to_company existe e está correta
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'user_belongs_to_company'
  ) THEN
    RAISE EXCEPTION 'Função user_belongs_to_company não encontrada!';
  END IF;
END $$;

-- 2. Verificar se as políticas RLS estão ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- 3. Verificar mensagens recentes e seus company_ids
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
    WHEN m.company_id IS NULL THEN '❌ NULL - precisa corrigir'
    ELSE '❌ Diferente - precisa corrigir'
  END as status_consistencia
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- 4. Corrigir mensagens sem company_id (usar company_id da conversa)
UPDATE messages m
SET company_id = c.company_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.company_id IS NULL
  AND m.created_at >= NOW() - INTERVAL '7 days';

-- 5. Verificar se há mensagens com company_id diferente da conversa
UPDATE messages m
SET company_id = c.company_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.company_id != c.company_id
  AND m.created_at >= NOW() - INTERVAL '7 days';

-- 6. Garantir que a função user_belongs_to_company tem as permissões corretas
GRANT EXECUTE ON FUNCTION user_belongs_to_company(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_belongs_to_company(UUID) TO anon;

-- 7. Verificar se as políticas estão usando a função corretamente
-- (As políticas devem estar usando user_belongs_to_company(company_id))

-- 8. Relatório final: Verificar distribuição de mensagens por empresa
SELECT 
  m.company_id,
  COUNT(*) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' THEN 1 END) as inbound,
  COUNT(CASE WHEN m.direction = 'outbound' THEN 1 END) as outbound,
  COUNT(CASE WHEN m.sender_type = 'human' THEN 1 END) as human,
  COUNT(CASE WHEN m.sender_type = 'ai' THEN 1 END) as ai,
  MAX(m.created_at) as ultima_mensagem
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY m.company_id
ORDER BY total_mensagens DESC;

