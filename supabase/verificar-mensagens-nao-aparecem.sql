-- ============================================
-- Script para verificar por que mensagens do contato não aparecem
-- ============================================

-- 1. Verificar mensagens recentes do Telegram (últimas 2 horas)
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  m.channel_message_id,
  c.channel,
  c.status as conversation_status,
  ct.name as contact_name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '2 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- 2. Verificar mensagens inbound especificamente
SELECT 
  COUNT(*) as total_inbound,
  MIN(m.created_at) as primeira,
  MAX(m.created_at) as ultima
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '2 hours';

-- 3. Verificar conversas do Telegram
SELECT 
  c.id,
  c.channel,
  c.status,
  c.channel_thread_id,
  ct.name as contact_name,
  COUNT(m.id) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_lead,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'ai' THEN 1 END) as mensagens_ia,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN contacts ct ON ct.id = c.contact_id
WHERE c.channel = 'telegram'
  AND c.created_at > NOW() - INTERVAL '2 hours'
GROUP BY c.id, c.channel, c.status, c.channel_thread_id, ct.name
ORDER BY MAX(m.created_at) DESC NULLS LAST
LIMIT 5;

-- 4. Verificar se há mensagens com company_id NULL (pode causar problemas de RLS)
SELECT 
  COUNT(*) as total_sem_company,
  direction,
  sender_type
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.company_id IS NULL
  AND m.created_at > NOW() - INTERVAL '2 hours'
GROUP BY direction, sender_type;

-- 5. Verificar logs de automação recentes
SELECT 
  id,
  automation_id,
  trigger_event,
  status,
  error_message,
  started_at,
  LEFT(trigger_data::text, 100) as trigger_data_preview
FROM automation_logs
WHERE started_at > NOW() - INTERVAL '2 hours'
ORDER BY started_at DESC
LIMIT 10;

