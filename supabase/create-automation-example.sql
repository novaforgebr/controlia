-- ============================================
-- Script para criar automação de exemplo
-- Execute este script para criar uma automação que envia mensagens para o n8n
-- ============================================

-- IMPORTANTE: Substitua os valores abaixo pelos seus dados reais

-- 1. Primeiro, encontre o ID da sua empresa
SELECT id, name FROM companies;

-- 2. Depois, crie a automação (substitua COMPANY_ID e N8N_WEBHOOK_URL)
-- Exemplo de n8n webhook URL: https://primary-production-1e1e4.up.railway.app/webhook/3f88c08f-fd6d-4578-adfc-42bcb83b0335/webhook

INSERT INTO automations (
  company_id,
  name,
  description,
  trigger_event,
  trigger_conditions,
  n8n_webhook_url,
  n8n_workflow_id,
  is_active,
  is_paused
) VALUES (
  'SEU_COMPANY_ID_AQUI',  -- Substitua pelo ID da sua empresa (ex: 'cae292bd-2cc7-42b9-9254-779ed011989e')
  'Agente IA - Telegram',
  'Processa mensagens do Telegram com Agent de IA do n8n',
  'new_message',
  '{}'::jsonb,  -- Condições vazias = processa todas as mensagens
  'SEU_N8N_WEBHOOK_URL_AQUI',  -- Substitua pela URL do webhook do n8n (ex: 'https://primary-production-1e1e4.up.railway.app/webhook/3f88c08f-fd6d-4578-adfc-42bcb83b0335/webhook')
  'SEU_WORKFLOW_ID_AQUI',  -- Substitua pelo ID do workflow (ex: 'EW96u6Ji0AqtS7up')
  true,  -- Ativa
  false  -- Não pausada
)
ON CONFLICT DO NOTHING;

-- 3. Verificar se foi criada
SELECT 
  id,
  name,
  company_id,
  trigger_event,
  n8n_webhook_url,
  is_active,
  is_paused
FROM automations
WHERE trigger_event = 'new_message'
ORDER BY created_at DESC
LIMIT 1;

-- ============================================
-- NOTA: Se você já tem uma automação mas ela não está funcionando:
-- ============================================

-- Verificar se está ativa e não pausada
SELECT 
  id,
  name,
  is_active,
  is_paused,
  n8n_webhook_url
FROM automations
WHERE trigger_event = 'new_message';

-- Ativar uma automação existente
-- UPDATE automations
-- SET is_active = true, is_paused = false
-- WHERE id = 'ID_DA_AUTOMACAO';

-- Atualizar webhook URL de uma automação existente
-- UPDATE automations
-- SET n8n_webhook_url = 'NOVA_URL_AQUI'
-- WHERE id = 'ID_DA_AUTOMACAO';

