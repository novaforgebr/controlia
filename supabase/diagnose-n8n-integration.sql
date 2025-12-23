-- ============================================
-- Script para diagnosticar integração com n8n
-- Execute este script para identificar problemas
-- ============================================

-- 1. Verificar automações ativas para 'new_message'
SELECT 
  id,
  company_id,
  name,
  n8n_webhook_url,
  is_active,
  is_paused,
  trigger_event,
  CASE 
    WHEN n8n_webhook_url IS NULL OR n8n_webhook_url = '' THEN '❌ URL não configurada'
    WHEN is_active = false THEN '❌ Inativa'
    WHEN is_paused = true THEN '⏸️ Pausada'
    ELSE '✅ Configurada e ativa'
  END as status
FROM automations
WHERE trigger_event = 'new_message'
ORDER BY created_at DESC;

-- 2. Verificar settings da empresa (secret do n8n)
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.settings->>'n8n_webhook_secret' as n8n_webhook_secret,
  CASE 
    WHEN c.settings->>'n8n_webhook_secret' IS NULL OR c.settings->>'n8n_webhook_secret' = '' THEN '❌ Secret não configurado'
    ELSE '✅ Secret configurado'
  END as secret_status
FROM companies c
ORDER BY c.created_at DESC
LIMIT 5;

-- 3. Verificar logs de automação recentes (últimas 24 horas)
SELECT 
  al.id,
  al.automation_id,
  a.name as automation_name,
  al.trigger_event,
  al.status,
  al.error_message,
  al.started_at,
  al.completed_at,
  CASE 
    WHEN al.status = 'error' THEN '❌ Erro'
    WHEN al.status = 'success' THEN '✅ Sucesso'
    ELSE '⏳ Em andamento'
  END as status_icon
FROM automation_logs al
LEFT JOIN automations a ON a.id = al.automation_id
WHERE al.started_at > NOW() - INTERVAL '24 hours'
ORDER BY al.started_at DESC
LIMIT 20;

-- 4. Verificar mensagens recentes que deveriam ter disparado automação
SELECT 
  m.id,
  m.conversation_id,
  m.direction,
  m.sender_type,
  LEFT(m.content, 50) as content_preview,
  m.created_at,
  c.channel,
  c.company_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 10;

-- 5. Verificar se há automação para a empresa das mensagens recentes
SELECT 
  m.id as message_id,
  m.created_at as message_created_at,
  c.company_id,
  a.id as automation_id,
  a.name as automation_name,
  a.is_active,
  a.is_paused,
  a.n8n_webhook_url,
  CASE 
    WHEN a.id IS NULL THEN '❌ Nenhuma automação encontrada'
    WHEN a.is_active = false THEN '❌ Automação inativa'
    WHEN a.is_paused = true THEN '⏸️ Automação pausada'
    WHEN a.n8n_webhook_url IS NULL OR a.n8n_webhook_url = '' THEN '❌ URL não configurada'
    ELSE '✅ Automação configurada'
  END as automation_status
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
LEFT JOIN automations a ON a.company_id = c.company_id 
  AND a.trigger_event = 'new_message'
  AND a.is_active = true
  AND a.is_paused = false
WHERE m.direction = 'inbound'
  AND m.sender_type = 'human'
  AND m.created_at > NOW() - INTERVAL '24 hours'
ORDER BY m.created_at DESC
LIMIT 10;

