-- ============================================
-- Script para corrigir automação e verificar secret
-- ============================================

-- 1. Verificar automação atual
SELECT 
  id,
  company_id,
  name,
  n8n_webhook_url,
  n8n_workflow_id,
  is_active,
  is_paused
FROM automations
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND trigger_event = 'new_message';

-- 2. Verificar secret configurado na empresa
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as n8n_webhook_secret_configurado,
  LENGTH(settings->>'n8n_webhook_secret') as secret_length
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';

-- 3. Atualizar automação (se necessário)
-- Se a automação já existe, apenas atualizar
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',
  n8n_workflow_id = 'EW96u6Ji0AqtS7up',
  is_active = TRUE,
  is_paused = FALSE,
  updated_at = NOW()
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND trigger_event = 'new_message';

-- 4. Se não existir, criar nova automação
INSERT INTO automations (
  id,
  company_id,
  name,
  description,
  trigger_event,
  n8n_webhook_url,
  n8n_workflow_id,
  is_active,
  is_paused,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'cae292bd-2cc7-42b9-9254-779ed011989e',
  'Atendimento com IA',
  'Encaminha novas mensagens recebidas para n8n para processamento de IA',
  'new_message',
  'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',
  'EW96u6Ji0AqtS7up',
  TRUE,
  FALSE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM automations
  WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
    AND trigger_event = 'new_message'
);

-- 5. Verificar resultado
SELECT 
  id,
  name,
  n8n_webhook_url,
  is_active,
  is_paused
FROM automations
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND trigger_event = 'new_message';

