-- ============================================
-- Script para remover secret da URL e usar Header Auth
-- Use esta abordagem se o query parameter não funcionar
-- ============================================

-- IMPORTANTE: Após executar este script, configure o n8n para usar "Header Auth"
-- com Name: X-Webhook-Secret e Value: N0v4F0rg3@2025

-- Remover secret da URL da automação "Atendimento com IA"
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa'
RETURNING id, name, n8n_webhook_url, is_active, is_paused;

-- Verificar resultado
SELECT 
  id,
  name,
  n8n_webhook_url,
  is_active,
  is_paused,
  CASE 
    WHEN n8n_webhook_url LIKE '%secret=%' THEN '❌ Secret ainda na URL'
    ELSE '✅ Secret removido da URL (usar Header Auth)'
  END as status
FROM automations
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';

-- Verificar se o secret está configurado nas settings da empresa
SELECT 
  id,
  name,
  settings->>'n8n_webhook_secret' as n8n_webhook_secret_configurado,
  CASE 
    WHEN settings->>'n8n_webhook_secret' IS NOT NULL THEN '✅ Secret configurado'
    ELSE '❌ Secret não configurado'
  END as status_secret
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';

