-- ============================================
-- DESABILITAR: Auto-desativar IA quando humano envia mensagem
-- ============================================
-- Este script desabilita o comportamento de desativar automaticamente
-- a IA quando uma mensagem humana é enviada
-- ============================================

-- Opção 1: Desabilitar para TODAS as empresas
UPDATE companies
SET settings = COALESCE(settings, '{}'::jsonb) || '{"settings_ai_auto_disable_on_human_message": false}'::jsonb
WHERE (settings->>'settings_ai_auto_disable_on_human_message')::boolean IS DISTINCT FROM false;

-- Opção 2: Desabilitar apenas para uma empresa específica
-- UPDATE companies
-- SET settings = COALESCE(settings, '{}'::jsonb) || '{"settings_ai_auto_disable_on_human_message": false}'::jsonb
-- WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';

-- Verificar resultado
SELECT 
  id,
  name,
  settings->>'settings_ai_auto_disable_on_human_message' as auto_disable_ia
FROM companies
WHERE id = 'cae292bd-2cc7-42b9-9254-779ed011989e';

