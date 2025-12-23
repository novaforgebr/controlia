-- ============================================
-- Script para atualizar automação com secret na URL (query parameter)
-- Use esta abordagem se preferir query parameter em vez de Header Auth
-- ============================================

-- IMPORTANTE: Se usar esta abordagem, configure o n8n para usar "None" como autenticação
-- e remova o Header Auth do webhook

-- Atualizar automação "Atendimento com IA"
UPDATE automations
SET 
  n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=N0v4F0rg3@2025',
  updated_at = NOW()
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';

-- Verificar resultado
SELECT 
  id,
  name,
  n8n_webhook_url,
  is_active,
  is_paused
FROM automations
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';

