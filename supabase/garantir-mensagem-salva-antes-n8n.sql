-- ============================================
-- GARANTIR: Mensagens são salvas ANTES de enviar para n8n
-- ============================================
-- Este script verifica se há mensagens que foram enviadas para n8n
-- mas não foram salvas no Controlia (problema crítico)
-- ============================================

-- Verificar se há logs de automação sem mensagem correspondente
SELECT 
  al.id as log_id,
  al.automation_id,
  al.trigger_event,
  al.status,
  al.started_at,
  al.trigger_data->>'message_id' as message_id_from_log,
  al.trigger_data->>'conversation_id' as conversation_id_from_log,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id::text = al.trigger_data->>'message_id'
    ) THEN '✅ Mensagem existe'
    ELSE '❌ Mensagem NÃO existe no banco!'
  END as status_mensagem
FROM automation_logs al
WHERE al.trigger_event = 'new_message'
  AND al.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC
LIMIT 20;

-- Verificar mensagens recebidas do Telegram nas últimas 24h
SELECT 
  m.id,
  m.content,
  m.direction,
  m.sender_type,
  m.company_id,
  m.conversation_id,
  m.created_at,
  c.channel,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM automation_logs al 
      WHERE al.trigger_data->>'message_id' = m.id::text
    ) THEN '✅ Enviada para n8n'
    ELSE '❌ NÃO foi enviada para n8n'
  END as status_n8n
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 20;

-- Verificar se company_id está consistente
SELECT 
  m.id,
  m.company_id as message_company_id,
  c.company_id as conversation_company_id,
  CASE 
    WHEN m.company_id = c.company_id THEN '✅ Consistente'
    WHEN m.company_id IS NULL THEN '❌ NULL - precisa corrigir'
    ELSE '❌ Diferente - precisa corrigir'
  END as status_consistencia
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 20;

