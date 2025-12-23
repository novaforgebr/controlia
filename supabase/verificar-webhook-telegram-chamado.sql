-- ============================================
-- Script para verificar se webhook do Telegram está sendo chamado
-- ============================================

-- Verificar mensagens do Telegram recentes (últimas 2 horas)
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  m.channel_message_id,
  c.channel,
  c.channel_thread_id,
  ct.name as contact_name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '2 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- Verificar se há mensagens inbound do Telegram que foram criadas recentemente
SELECT 
  COUNT(*) as total_inbound_telegram,
  MIN(m.created_at) as primeira,
  MAX(m.created_at) as ultima
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '2 hours';

-- Verificar mensagens por conversa do Telegram
SELECT 
  c.id as conversation_id,
  c.channel_thread_id,
  ct.name as contact_name,
  COUNT(m.id) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_lead,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'ai' THEN 1 END) as mensagens_ia,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_operador,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN contacts ct ON ct.id = c.contact_id
WHERE c.channel = 'telegram'
  AND c.created_at > NOW() - INTERVAL '2 hours'
GROUP BY c.id, c.channel_thread_id, ct.name
ORDER BY MAX(m.created_at) DESC NULLS LAST
LIMIT 5;

