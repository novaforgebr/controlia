-- ============================================
-- DIAGNÓSTICO: Mensagens do Telegram não aparecem no Controlia
-- ============================================

-- 1. Verificar mensagens recebidas do Telegram nas últimas 24 horas
SELECT 
  m.id,
  m.content,
  m.direction,
  m.sender_type,
  m.company_id,
  m.conversation_id,
  m.contact_id,
  m.created_at,
  c.channel,
  c.company_id as conversation_company_id,
  CASE 
    WHEN m.company_id = c.company_id THEN '✅ Consistente'
    WHEN m.company_id IS NULL THEN '❌ NULL - precisa corrigir'
    ELSE '❌ Diferente - precisa corrigir'
  END as status_consistencia
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- 2. Verificar se há mensagens inbound (recebidas do usuário)
SELECT 
  COUNT(*) as total_mensagens_inbound,
  COUNT(CASE WHEN m.direction = 'inbound' AND m.sender_type = 'human' THEN 1 END) as mensagens_humanas_inbound,
  COUNT(CASE WHEN m.direction = 'outbound' AND m.sender_type = 'ai' THEN 1 END) as mensagens_ia_outbound,
  MAX(m.created_at) as ultima_mensagem
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.created_at >= NOW() - INTERVAL '24 hours';

-- 3. Verificar distribuição de direções e sender types
SELECT 
  m.direction,
  m.sender_type,
  COUNT(*) as total
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY m.direction, m.sender_type
ORDER BY m.direction, m.sender_type;

-- 4. Verificar se há problemas de RLS (mensagens sem company_id)
SELECT 
  COUNT(*) as mensagens_sem_company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.company_id IS NULL
  AND m.created_at >= NOW() - INTERVAL '24 hours';

-- 5. Verificar conversas do Telegram
SELECT 
  c.id,
  c.channel,
  c.company_id,
  c.contact_id,
  c.last_message_at,
  COUNT(m.id) as total_mensagens
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.channel = 'telegram'
  AND c.last_message_at >= NOW() - INTERVAL '24 hours'
GROUP BY c.id, c.channel, c.company_id, c.contact_id, c.last_message_at
ORDER BY c.last_message_at DESC
LIMIT 10;

-- 6. Verificar logs de automação (para ver se n8n está sendo chamado)
SELECT 
  al.id,
  al.automation_id,
  a.name as automation_name,
  al.status,
  al.error_message,
  al.started_at,
  al.completed_at,
  al.trigger_data->>'message_id' as message_id_from_log
FROM automation_logs al
JOIN automations a ON a.id = al.automation_id
WHERE al.trigger_event = 'new_message'
  AND al.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC
LIMIT 10;

