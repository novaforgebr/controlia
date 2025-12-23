-- ============================================
-- Script URGENTE: Remover secret da URL para usar Header Auth
-- O n8n está configurado para Header Auth, mas a URL ainda tem secret
-- ============================================

-- Remover secret da URL da automação "Atendimento com IA"
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa'
RETURNING id, name, n8n_webhook_url;

-- Verificar resultado
SELECT 
  id,
  name,
  n8n_webhook_url,
  CASE 
    WHEN n8n_webhook_url LIKE '%secret=%' THEN '❌ Secret ainda na URL'
    ELSE '✅ Secret removido - usando Header Auth'
  END as status
FROM automations
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';

