-- ============================================
-- Script para verificar mensagens inbound recentes
-- Execute este script após enviar uma mensagem do Telegram
-- ============================================

-- 1. Verificar TODAS as mensagens recentes (última hora)
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.company_id as message_company_id,
  LEFT(m.content, 100) as content_preview,
  m.created_at,
  c.company_id as conversation_company_id,
  c.channel,
  c.status as conversation_status,
  ct.name as contact_name,
  CASE 
    WHEN m.company_id = c.company_id THEN '✅ Consistente'
    WHEN m.company_id IS NULL AND c.company_id IS NULL THEN '⚠️ Ambos NULL'
    WHEN m.company_id IS NULL THEN '❌ Mensagem NULL, conversa tem company_id'
    ELSE '❌ Diferente'
  END as status_consistencia
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 50;

-- 2. Contar mensagens por tipo (última hora)
SELECT 
  direction,
  sender_type,
  COUNT(*) as total,
  MIN(created_at) as primeira,
  MAX(created_at) as ultima
FROM messages
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY direction, sender_type
ORDER BY direction, sender_type;

-- 3. Verificar mensagens inbound especificamente
SELECT 
  COUNT(*) as total_inbound,
  COUNT(CASE WHEN m.company_id = c.company_id THEN 1 END) as consistentes,
  COUNT(CASE WHEN m.company_id IS DISTINCT FROM c.company_id THEN 1 END) as inconsistentes,
  COUNT(CASE WHEN m.company_id IS NULL THEN 1 END) as sem_company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '1 hour';

-- 4. Verificar se há mensagens do Telegram recentes
SELECT 
  m.id,
  m.direction,
  m.sender_type,
  m.content,
  m.created_at,
  c.channel,
  c.channel_thread_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 20;

