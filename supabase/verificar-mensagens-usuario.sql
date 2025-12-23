-- ============================================
-- Script para verificar mensagens do usuário (inbound)
-- Execute este script para diagnosticar por que mensagens do usuário não aparecem
-- ============================================

-- 1. Verificar todas as mensagens recentes (últimas 24 horas)
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  c.channel,
  c.status as conversation_status,
  ct.name as contact_name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
JOIN contacts ct ON ct.id = m.contact_id
WHERE m.created_at > NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- 2. Verificar mensagens inbound especificamente
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.content,
  m.created_at,
  c.channel,
  ct.name as contact_name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
JOIN contacts ct ON ct.id = m.contact_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 10;

-- 3. Verificar mensagens por conversa (últimas 5 conversas)
SELECT 
  c.id as conversation_id,
  c.channel,
  c.status,
  ct.name as contact_name,
  COUNT(m.id) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_usuario,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'ai' THEN 1 END) as mensagens_ia,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_operador,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN contacts ct ON ct.id = c.contact_id
WHERE c.created_at > NOW() - INTERVAL '24 hours'
GROUP BY c.id, c.channel, c.status, ct.name
ORDER BY MAX(m.created_at) DESC NULLS LAST
LIMIT 5;

-- 4. Verificar se há mensagens com company_id NULL (pode causar problemas de RLS)
SELECT 
  COUNT(*) as total_mensagens_sem_company,
  direction,
  sender_type
FROM messages
WHERE company_id IS NULL
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY direction, sender_type;

-- 5. Verificar mensagens do Telegram especificamente
SELECT 
  m.id,
  m.conversation_id,
  m.content,
  m.direction,
  m.sender_type,
  m.created_at,
  c.channel,
  c.channel_thread_id,
  ct.name as contact_name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 10;

