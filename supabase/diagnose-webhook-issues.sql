-- ============================================
-- Script de Diagnóstico para Webhooks
-- Execute este script para verificar se há problemas com RLS ou dados
-- ============================================

-- 1. Verificar se há mensagens sendo criadas
SELECT 
  COUNT(*) as total_mensagens,
  COUNT(DISTINCT conversation_id) as total_conversas,
  COUNT(DISTINCT contact_id) as total_contatos,
  MIN(created_at) as primeira_mensagem,
  MAX(created_at) as ultima_mensagem
FROM messages;

-- 2. Verificar mensagens por direção (inbound = do cliente, outbound = do app/IA)
SELECT 
  direction,
  sender_type,
  COUNT(*) as total,
  MAX(created_at) as ultima_mensagem
FROM messages
GROUP BY direction, sender_type
ORDER BY direction, sender_type;

-- 3. Verificar conversas e suas mensagens
SELECT 
  c.id as conversation_id,
  c.channel,
  c.status,
  c.channel_thread_id,
  COUNT(m.id) as total_mensagens,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.channel, c.status, c.channel_thread_id
ORDER BY MAX(m.created_at) DESC NULLS LAST
LIMIT 10;

-- 4. Verificar contatos do Telegram
SELECT 
  id,
  name,
  company_id,
  custom_fields->>'telegram_id' as telegram_id,
  custom_fields->>'telegram_username' as telegram_username,
  source,
  created_at
FROM contacts
WHERE source = 'telegram' OR custom_fields->>'telegram_id' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 5. Verificar automações configuradas
SELECT 
  id,
  name,
  company_id,
  trigger_event,
  n8n_webhook_url,
  is_active,
  is_paused,
  created_at
FROM automations
WHERE trigger_event = 'new_message'
  AND is_active = true
  AND is_paused = false
ORDER BY created_at DESC;

-- 6. Verificar logs de automação (últimas execuções)
SELECT 
  id,
  automation_id,
  trigger_event,
  status,
  error_message,
  started_at,
  completed_at
FROM automation_logs
ORDER BY started_at DESC
LIMIT 20;

-- 7. Verificar se há problemas de RLS (verificar políticas)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('messages', 'conversations', 'contacts', 'automations')
ORDER BY tablename, policyname;

-- 8. Verificar mensagens recentes com detalhes
SELECT 
  m.id,
  m.conversation_id,
  m.contact_id,
  m.sender_type,
  m.direction,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  c.channel,
  c.channel_thread_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
ORDER BY m.created_at DESC
LIMIT 20;

