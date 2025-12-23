-- ============================================
-- Script para verificar mensagens inbound (do lead)
-- Execute este script para diagnosticar por que mensagens do lead não aparecem
-- ============================================

-- 1. Verificar todas as mensagens inbound recentes
SELECT 
  m.id,
  m.conversation_id,
  m.contact_id,
  m.sender_type,
  m.direction,
  LEFT(m.content, 100) as content_preview,
  m.content_type,
  m.channel_message_id,
  m.created_at,
  c.channel,
  c.status as conversation_status,
  ct.name as contact_name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
JOIN contacts ct ON ct.id = m.contact_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
ORDER BY m.created_at DESC
LIMIT 20;

-- 2. Verificar se há mensagens sem conteúdo
SELECT 
  COUNT(*) as total_mensagens_sem_conteudo,
  MIN(created_at) as primeira,
  MAX(created_at) as ultima
FROM messages
WHERE direction = 'inbound'
  AND (content IS NULL OR content = '' OR content = '[Mensagem sem texto]');

-- 3. Verificar mensagens por conversa (últimas 5 conversas)
SELECT 
  c.id as conversation_id,
  c.channel,
  c.status,
  c.channel_thread_id,
  COUNT(m.id) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' THEN 1 END) as mensagens_inbound,
  COUNT(CASE WHEN m.direction = 'outbound' THEN 1 END) as mensagens_outbound,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.channel, c.status, c.channel_thread_id
ORDER BY MAX(m.created_at) DESC NULLS LAST
LIMIT 5;

-- 4. Verificar se há mensagens com company_id NULL (pode causar problemas de RLS)
SELECT 
  COUNT(*) as total_mensagens_sem_company,
  direction,
  sender_type
FROM messages
WHERE company_id IS NULL
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
  c.channel_thread_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
ORDER BY m.created_at DESC
LIMIT 10;

