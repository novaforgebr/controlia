-- ============================================
-- Script para verificar configuração do webhook do Telegram
-- ============================================

-- 1. Verificar configurações da empresa relacionadas ao Telegram
SELECT 
  id,
  name,
  settings->>'telegram_bot_token' as telegram_bot_token_configurado,
  settings->>'telegram_webhook_url' as telegram_webhook_url_configurado,
  settings->>'n8n_webhook_secret' as n8n_webhook_secret_configurado
FROM companies
WHERE settings->>'telegram_bot_token' IS NOT NULL
ORDER BY created_at DESC;

-- 2. Verificar se há mensagens inbound do Telegram que foram criadas recentemente
SELECT 
  COUNT(*) as total_mensagens_inbound_telegram,
  MIN(created_at) as primeira_mensagem,
  MAX(created_at) as ultima_mensagem
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours';

-- 3. Verificar conversas do Telegram recentes
SELECT 
  c.id,
  c.channel,
  c.status,
  c.channel_thread_id,
  c.created_at,
  ct.name as contact_name,
  COUNT(m.id) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_lead,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'ai' THEN 1 END) as mensagens_ia,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN contacts ct ON ct.id = c.contact_id
WHERE c.channel = 'telegram'
  AND c.created_at > NOW() - INTERVAL '24 hours'
GROUP BY c.id, c.channel, c.status, c.channel_thread_id, c.created_at, ct.name
ORDER BY MAX(m.created_at) DESC NULLS LAST
LIMIT 10;

