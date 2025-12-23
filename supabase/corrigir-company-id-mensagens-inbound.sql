-- ============================================
-- Script para corrigir company_id de mensagens inbound
-- Garante que mensagens tenham o mesmo company_id da conversa/contato
-- ============================================

-- 1. Atualizar mensagens inbound que têm company_id diferente da conversa
UPDATE messages m
SET company_id = c.company_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.company_id IS DISTINCT FROM c.company_id
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours';

-- 2. Atualizar mensagens inbound que têm company_id NULL
UPDATE messages m
SET company_id = c.company_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.company_id IS NULL
  AND c.company_id IS NOT NULL
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours';

-- 3. Verificar resultado
SELECT 
  COUNT(*) as total_corrigidas,
  COUNT(CASE WHEN m.company_id = c.company_id THEN 1 END) as agora_consistente
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours';

-- 4. Verificar se ainda há inconsistências
SELECT 
  m.id,
  m.conversation_id,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  m.direction,
  m.sender_type,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.company_id IS DISTINCT FROM c.company_id
  AND m.created_at > NOW() - INTERVAL '24 hours'
LIMIT 10;

