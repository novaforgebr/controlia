-- ============================================
-- SCRIPT DE DIAGNÓSTICO E VALIDAÇÃO
-- WEBHOOKS DO TELEGRAM COM COMPANY_ID
-- ============================================
-- Este script verifica e diagnostica problemas com
-- a configuração de webhooks do Telegram
-- ============================================

-- 1. VERIFICAR EMPRESAS COM TOKEN DO TELEGRAM CONFIGURADO
-- ============================================
SELECT 
    id,
    name,
    is_active,
    (settings->>'telegram_bot_token') as bot_token_preview,
    CASE 
        WHEN settings->>'telegram_bot_token' IS NOT NULL 
        THEN SUBSTRING(settings->>'telegram_bot_token', 1, 10) || '...'
        ELSE 'NÃO CONFIGURADO'
    END as token_status,
    settings->>'telegram_webhook_url' as webhook_url,
    CASE 
        WHEN settings->>'telegram_webhook_url' LIKE '%company_id=%' 
        THEN '✅ URL com company_id'
        WHEN settings->>'telegram_webhook_url' IS NOT NULL 
        THEN '⚠️ URL sem company_id'
        ELSE '❌ URL não configurada'
    END as webhook_url_status,
    created_at
FROM companies
WHERE settings->>'telegram_bot_token' IS NOT NULL
ORDER BY created_at DESC;

-- 2. VERIFICAR TOKENS DUPLICADOS (PROBLEMA CRÍTICO)
-- ============================================
SELECT 
    settings->>'telegram_bot_token' as bot_token,
    COUNT(*) as empresas_com_mesmo_token,
    STRING_AGG(name, ', ') as empresas_afetadas,
    STRING_AGG(id::text, ', ') as company_ids
FROM companies
WHERE settings->>'telegram_bot_token' IS NOT NULL
    AND settings->>'telegram_bot_token' != ''
GROUP BY settings->>'telegram_bot_token'
HAVING COUNT(*) > 1;

-- 3. VERIFICAR WEBHOOKS SEM COMPANY_ID NA URL
-- ============================================
SELECT 
    id,
    name,
    settings->>'telegram_webhook_url' as webhook_url_atual,
    CASE 
        WHEN settings->>'telegram_webhook_url' LIKE '%company_id=' || id::text || '%'
        THEN '✅ URL correta'
        WHEN settings->>'telegram_webhook_url' LIKE '%company_id=%'
        THEN '⚠️ URL tem company_id mas pode ser de outra empresa'
        WHEN settings->>'telegram_webhook_url' IS NOT NULL
        THEN '❌ URL sem company_id'
        ELSE '❌ URL não configurada'
    END as status_url
FROM companies
WHERE settings->>'telegram_bot_token' IS NOT NULL
    AND (
        settings->>'telegram_webhook_url' IS NULL
        OR settings->>'telegram_webhook_url' NOT LIKE '%company_id=' || id::text || '%'
    )
ORDER BY name;

-- 4. ESTATÍSTICAS GERAIS
-- ============================================
SELECT 
    COUNT(*) as total_empresas,
    COUNT(CASE WHEN settings->>'telegram_bot_token' IS NOT NULL THEN 1 END) as empresas_com_token,
    COUNT(CASE 
        WHEN settings->>'telegram_webhook_url' IS NOT NULL 
        AND settings->>'telegram_webhook_url' LIKE '%company_id=' || id::text || '%'
        THEN 1 
    END) as empresas_com_webhook_correto,
    COUNT(CASE 
        WHEN settings->>'telegram_webhook_url' IS NOT NULL 
        AND settings->>'telegram_webhook_url' NOT LIKE '%company_id=' || id::text || '%'
        THEN 1 
    END) as empresas_com_webhook_incorreto
FROM companies;

-- 5. VERIFICAR MENSAGENS RECEBIDAS RECENTEMENTE
-- ============================================
-- Verificar se há mensagens associadas à empresa errada
-- (útil para diagnosticar problemas de roteamento)
SELECT 
    m.id as message_id,
    m.created_at,
    m.content,
    c.name as company_name,
    c.id as company_id,
    conv.channel,
    cont.name as contact_name
FROM messages m
JOIN companies c ON m.company_id = c.id
JOIN conversations conv ON m.conversation_id = conv.id
JOIN contacts cont ON m.contact_id = cont.id
WHERE conv.channel = 'telegram'
    AND m.created_at > NOW() - INTERVAL '7 days'
ORDER BY m.created_at DESC
LIMIT 50;

-- 6. VERIFICAR CONTATOS DO TELEGRAM POR EMPRESA
-- ============================================
SELECT 
    c.id as company_id,
    c.name as company_name,
    COUNT(DISTINCT cont.id) as total_contatos_telegram,
    COUNT(DISTINCT CASE 
        WHEN cont.custom_fields->>'telegram_id' IS NOT NULL 
        THEN cont.id 
    END) as contatos_com_telegram_id,
    COUNT(DISTINCT conv.id) as conversas_telegram
FROM companies c
LEFT JOIN contacts cont ON cont.company_id = c.id
    AND (cont.custom_fields->>'telegram_id' IS NOT NULL 
         OR cont.custom_fields->>'telegram_username' IS NOT NULL)
LEFT JOIN conversations conv ON conv.company_id = c.id
    AND conv.channel = 'telegram'
WHERE c.settings->>'telegram_bot_token' IS NOT NULL
GROUP BY c.id, c.name
ORDER BY total_contatos_telegram DESC;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Se houver tokens duplicados (query 2), isso é um problema crítico
--    e deve ser corrigido imediatamente. Cada empresa deve ter seu próprio token.
--
-- 2. Se houver webhooks sem company_id (query 3), use o botão 
--    "Reconfigurar Webhook" na interface para corrigir.
--
-- 3. A URL correta do webhook deve ser:
--    https://controliaa.vercel.app/api/webhooks/telegram?company_id={company_id}
--
-- 4. Para reconfigurar todos os webhooks, use a função na interface:
--    Configurações > Integrações > Telegram > "Reconfigurar Todos"
-- ============================================

