-- ============================================
-- Script para verificar automações configuradas
-- Execute este script para diagnosticar por que mensagens não são enviadas para n8n
-- ============================================

-- 1. Verificar todas as automações
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

-- 2. Verificar automações ativas para 'new_message'
SELECT 
  id,
  company_id,
  name,
  n8n_webhook_url,
  is_active,
  is_paused,
  trigger_event
FROM automations
WHERE trigger_event = 'new_message'
  AND is_active = true
  AND is_paused = false;

-- 3. Verificar automações por empresa (substitua COMPANY_ID pelo ID da sua empresa)
SELECT 
  a.id,
  a.name,
  a.trigger_event,
  a.n8n_webhook_url,
  a.is_active,
  a.is_paused,
  c.name as company_name,
  c.id as company_id
FROM automations a
JOIN companies c ON c.id = a.company_id
WHERE a.trigger_event = 'new_message'
ORDER BY c.name, a.name;

-- 4. Verificar logs de automação (últimas execuções)
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

-- 5. Verificar se há automações sem webhook URL configurado
SELECT 
  id,
  name,
  company_id,
  trigger_event,
  n8n_webhook_url,
  is_active
FROM automations
WHERE trigger_event = 'new_message'
  AND is_active = true
  AND (n8n_webhook_url IS NULL OR n8n_webhook_url = '');

