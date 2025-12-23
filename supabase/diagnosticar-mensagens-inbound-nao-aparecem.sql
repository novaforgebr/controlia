-- ============================================
-- Script para diagnosticar por que mensagens inbound não aparecem
-- ============================================

-- 1. Verificar mensagens inbound recentes e seus company_id
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  m.company_id as message_company_id,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  c.company_id as conversation_company_id,
  c.channel,
  c.status as conversation_status,
  ct.company_id as contact_company_id,
  ct.name as contact_name
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '2 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- 2. Verificar se há inconsistência de company_id
SELECT 
  COUNT(*) as total_inconsistencias,
  COUNT(CASE WHEN m.company_id != c.company_id THEN 1 END) as company_id_diferente_conversation,
  COUNT(CASE WHEN m.company_id != ct.company_id THEN 1 END) as company_id_diferente_contact,
  COUNT(CASE WHEN m.company_id IS NULL THEN 1 END) as company_id_null
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN contacts ct ON ct.id = m.contact_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '2 hours';

-- 3. Verificar políticas RLS atuais
SELECT 
  polname AS policy_name,
  polcmd AS cmd,
  polroles AS roles,
  pg_get_expr(polqual, polrelid) AS qual,
  pg_get_expr(polwithcheck, polrelid) AS with_check
FROM pg_policy
WHERE polrelid::regclass::text = 'messages'
ORDER BY polname;

-- 4. Verificar se a função user_belongs_to_company existe
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'user_belongs_to_company';

-- 5. Verificar mensagens por company_id (últimas 2 horas)
SELECT 
  m.company_id,
  COUNT(*) as total_mensagens,
  COUNT(CASE WHEN m.direction = 'inbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_inbound,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'ai' THEN 1 END) as mensagens_ia,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_operador
FROM messages m
WHERE m.created_at > NOW() - INTERVAL '2 hours'
GROUP BY m.company_id
ORDER BY total_mensagens DESC;

-- 6. Verificar se há mensagens com company_id NULL
SELECT 
  COUNT(*) as total_mensagens_sem_company,
  direction,
  sender_type
FROM messages
WHERE company_id IS NULL
  AND created_at > NOW() - INTERVAL '2 hours'
GROUP BY direction, sender_type;

