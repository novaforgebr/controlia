-- ============================================
-- SCRIPT OPCIONAL: OTIMIZAÇÃO DE PERFORMANCE
-- Índices para melhorar consultas no campo settings
-- ============================================
-- Este script é OPCIONAL e apenas melhora a performance
-- das consultas que buscam tokens do Telegram no campo JSONB
-- ============================================

-- Criar índice GIN no campo settings para melhorar buscas
-- Isso acelera consultas que filtram por telegram_bot_token
CREATE INDEX IF NOT EXISTS idx_companies_settings_gin 
ON companies USING GIN (settings);

-- Criar índice específico para empresas com token do Telegram configurado
-- Isso acelera a busca de empresas que têm integração com Telegram
CREATE INDEX IF NOT EXISTS idx_companies_telegram_token 
ON companies ((settings->>'telegram_bot_token')) 
WHERE settings->>'telegram_bot_token' IS NOT NULL;

-- Criar índice para buscar contatos por telegram_id no custom_fields
-- Usando expressão ao invés de GIN direto em text
CREATE INDEX IF NOT EXISTS idx_contacts_telegram_id 
ON contacts ((custom_fields->>'telegram_id'))
WHERE custom_fields->>'telegram_id' IS NOT NULL;

-- Criar índice para buscar contatos por telegram_username no custom_fields
-- Usando expressão ao invés de GIN direto em text
CREATE INDEX IF NOT EXISTS idx_contacts_telegram_username 
ON contacts ((custom_fields->>'telegram_username'))
WHERE custom_fields->>'telegram_username' IS NOT NULL;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Estes índices são OPCIONAIS e apenas melhoram a performance
-- 2. Se você já tem muitas empresas/contatos, pode levar alguns minutos para criar
-- 3. Não há problema em executar este script mesmo se os índices já existirem
--    (usamos IF NOT EXISTS)
-- ============================================

