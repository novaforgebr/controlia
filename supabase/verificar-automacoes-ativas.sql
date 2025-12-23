-- ============================================
-- Script para verificar automações ativas para new_message
-- ============================================

-- Verificar todas as automações
SELECT 
  id,
  company_id,
  name,
  description,
  trigger_event,
  n8n_webhook_url,
  n8n_workflow_id,
  is_active,
  is_paused,
  last_executed_at,
  execution_count,
  error_count,
  created_at
FROM automations
ORDER BY created_at DESC;

-- Verificar automações ativas para 'new_message' (as que devem ser disparadas)
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
    ELSE '✅ URL configurada'
  END as status_url
FROM automations
WHERE trigger_event = 'new_message'
  AND is_active = true
  AND is_paused = false;

-- Verificar automações por empresa (substitua COMPANY_ID pelo ID da sua empresa)
-- Primeiro, vamos ver todas as empresas:
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as n8n_webhook_secret_configurado
FROM companies
ORDER BY created_at DESC;

-- Agora verificar automações para cada empresa:
SELECT 
  a.id,
  a.name,
  a.trigger_event,
  a.n8n_webhook_url,
  a.is_active,
  a.is_paused,
  c.name as company_name,
  c.id as company_id,
  CASE 
    WHEN a.n8n_webhook_url IS NULL OR a.n8n_webhook_url = '' THEN '❌ URL não configurada'
    WHEN a.is_active = false THEN '❌ Inativa'
    WHEN a.is_paused = true THEN '⏸️ Pausada'
    ELSE '✅ Pronta para uso'
  END as status
FROM automations a
JOIN companies c ON c.id = a.company_id
WHERE a.trigger_event = 'new_message'
ORDER BY c.name, a.name;

-- Verificar logs de automação recentes (últimas 2 horas)
SELECT 
  id,
  automation_id,
  trigger_event,
  status,
  error_message,
  started_at,
  completed_at,
  LEFT(trigger_data::text, 100) as trigger_data_preview
FROM automation_logs
WHERE started_at > NOW() - INTERVAL '2 hours'
ORDER BY started_at DESC
LIMIT 20;

