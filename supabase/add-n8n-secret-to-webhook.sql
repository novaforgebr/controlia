-- ============================================
-- Script para adicionar secret do n8n à URL do webhook
-- Execute este script para corrigir o erro "Provided secret is not valid"
-- ============================================

-- IMPORTANTE: Antes de executar, você precisa:
-- 1. Obter o secret do seu webhook n8n
-- 2. Substituir SEU_SECRET_AQUI pelo secret real
-- 3. Substituir AUTOMATION_ID pelo ID da sua automação

-- Como obter o secret do n8n:
-- 1. No n8n, abra seu workflow
-- 2. Clique no nó "Webhook" (Telegram Trigger)
-- 3. Nas configurações, procure por "Authentication" ou "Secret"
-- 4. Copie o secret configurado

-- Opção 1: Atualizar URL do webhook adicionando ?secret=xxx
UPDATE automations
SET n8n_webhook_url = n8n_webhook_url || '?secret=SEU_SECRET_AQUI'
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa'  -- Substitua pelo ID da sua automação
  AND n8n_webhook_url NOT LIKE '%secret=%';  -- Só atualiza se não tiver secret já

-- Opção 2: Se a URL já tiver query parameters, usar &secret=xxx
-- UPDATE automations
-- SET n8n_webhook_url = n8n_webhook_url || '&secret=SEU_SECRET_AQUI'
-- WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa'
--   AND n8n_webhook_url LIKE '%?%'
--   AND n8n_webhook_url NOT LIKE '%secret=%';

-- Opção 3: Substituir URL completa (se preferir)
-- UPDATE automations
-- SET n8n_webhook_url = 'https://controlia.up.railway.app/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook?secret=SEU_SECRET_AQUI'
-- WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';

-- Verificar se foi atualizado
SELECT 
  id,
  name,
  n8n_webhook_url,
  is_active
FROM automations
WHERE id = '49666eb5-d6ca-45f6-9944-9c58354ad6aa';

-- ============================================
-- NOTA: Se você não souber o secret, você pode:
-- ============================================
-- 1. Desabilitar autenticação no n8n (não recomendado para produção):
--    - No n8n, abra o workflow
--    - Clique no nó "Webhook"
--    - Desabilite a opção "Authentication" ou "Require Secret"
--
-- 2. Ou configurar um novo secret no n8n e usar esse novo secret na URL

