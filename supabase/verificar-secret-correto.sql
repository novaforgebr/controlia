-- ============================================
-- Script para verificar se o secret está correto
-- ============================================

-- 1. Verificar secret no Controlia
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as secret_no_controlia,
  LENGTH(settings->>'n8n_webhook_secret') as tamanho,
  -- Verificar se há espaços extras
  LENGTH(TRIM(settings->>'n8n_webhook_secret')) as tamanho_sem_espacos,
  -- Verificar encoding
  encode(convert_to(settings->>'n8n_webhook_secret', 'UTF8'), 'hex') as secret_hex
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';

-- 2. Verificar automações e suas URLs
SELECT 
  id,
  name,
  n8n_webhook_url,
  CASE 
    WHEN n8n_webhook_url LIKE '%secret=%' THEN '✅ Secret na URL'
    ELSE '❌ Secret não na URL (usando Header Auth)'
  END as tipo_autenticacao,
  CASE 
    WHEN n8n_webhook_url LIKE '%secret=%' THEN 
      SUBSTRING(n8n_webhook_url FROM 'secret=([^&]+)')
    ELSE NULL
  END as secret_na_url
FROM automations
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND trigger_event = 'new_message'
  AND is_active = true;

-- 3. Comparar secrets
SELECT 
  'Controlia Settings' as origem,
  settings->>'n8n_webhook_secret' as secret_value,
  LENGTH(settings->>'n8n_webhook_secret') as tamanho
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
UNION ALL
SELECT 
  'Automation URL' as origem,
  SUBSTRING(n8n_webhook_url FROM 'secret=([^&]+)') as secret_value,
  LENGTH(SUBSTRING(n8n_webhook_url FROM 'secret=([^&]+)')) as tamanho
FROM automations
WHERE company_id = 'cae292bd-2cc7-42b9-9254-779ed011989e'
  AND n8n_webhook_url LIKE '%secret=%'
LIMIT 2;

