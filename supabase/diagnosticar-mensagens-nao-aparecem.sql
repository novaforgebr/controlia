-- ============================================
-- Script para diagnosticar por que mensagens não aparecem
-- ============================================

-- 1. Verificar mensagens mais recentes do Telegram (última hora)
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  m.company_id,
  c.channel,
  c.status as conversation_status,
  c.company_id as conversation_company_id,
  ct.name as contact_name,
  ct.company_id as contact_company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 20;

-- 2. Verificar se há mensagens inbound recentes
SELECT 
  COUNT(*) as total_inbound,
  MIN(m.created_at) as primeira,
  MAX(m.created_at) as ultima,
  COUNT(DISTINCT m.conversation_id) as conversas_diferentes
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '1 hour';

-- 3. Verificar company_id das mensagens vs company_id do usuário
-- (Substitua USER_ID pelo ID do usuário logado)
SELECT 
  m.id,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  ct.company_id as contact_company_id,
  m.direction,
  m.sender_type,
  m.created_at
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE c.channel = 'telegram'
  AND m.created_at > NOW() - INTERVAL '1 hour'
ORDER BY m.created_at DESC
LIMIT 10;

-- 4. Verificar se há mensagens com company_id NULL
SELECT 
  COUNT(*) as total_sem_company,
  direction,
  sender_type
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.company_id IS NULL
  AND m.created_at > NOW() - INTERVAL '1 hour'
GROUP BY direction, sender_type;

-- 5. Verificar conversas ativas do Telegram
SELECT 
  c.id,
  c.channel,
  c.status,
  c.company_id,
  c.channel_thread_id,
  ct.name as contact_name,
  ct.company_id as contact_company_id,
  COUNT(m.id) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_lead,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN contacts ct ON ct.id = c.contact_id
WHERE c.channel = 'telegram'
  AND c.created_at > NOW() - INTERVAL '1 hour'
GROUP BY c.id, c.channel, c.status, c.company_id, c.channel_thread_id, ct.name, ct.company_id
ORDER BY MAX(m.created_at) DESC NULLS LAST
LIMIT 5;

-- 6. Verificar RLS para messages
SELECT 
  polname AS policy_name,
  polpermissive AS permissive,
  polcmd AS cmd,
  polroles AS roles,
  pg_get_expr(polqual, polrelid) AS qual,
  pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;

-- 7. Verificar se RLS está habilitado
SELECT 
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'messages';

