-- ============================================
-- Script para verificar configurações do Telegram
-- Execute este script para verificar se as configurações foram salvas corretamente
-- ============================================

-- 1. Ver todas as empresas e suas configurações do Telegram
SELECT 
  id,
  name,
  settings->>'telegram_bot_token' as telegram_bot_token,
  settings->>'telegram_webhook_url' as telegram_webhook_url,
  settings->>'telegram_webhook_secret' as telegram_webhook_secret,
  CASE 
    WHEN settings->>'telegram_bot_token' IS NOT NULL 
      AND settings->>'telegram_bot_token' != '' 
    THEN 'Configurado'
    ELSE 'Não configurado'
  END as status
FROM companies
ORDER BY created_at DESC;

-- 2. Ver apenas empresas com bot token configurado
SELECT 
  id,
  name,
  settings->>'telegram_bot_token' as telegram_bot_token
FROM companies
WHERE settings->>'telegram_bot_token' IS NOT NULL 
  AND settings->>'telegram_bot_token' != ''
ORDER BY created_at DESC;

-- 3. Atualizar manualmente o bot token (se necessário)
-- Substitua 'SEU_COMPANY_ID' pelo ID da sua empresa
-- Substitua 'SEU_BOT_TOKEN' pelo seu bot token
/*
UPDATE companies
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{telegram_bot_token}',
  '"SEU_BOT_TOKEN"'
)
WHERE id = 'SEU_COMPANY_ID';
*/

-- 4. Verificar estrutura do campo settings
SELECT 
  id,
  name,
  jsonb_typeof(settings) as settings_type,
  jsonb_object_keys(settings) as settings_keys
FROM companies
LIMIT 1;

