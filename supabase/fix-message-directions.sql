-- ============================================
-- SCRIPT DE CORREÇÃO: Mensagens com direção incorreta
-- ============================================
-- Este script corrige mensagens que foram salvas com direction/sender_type incorretos
--
-- PROBLEMA IDENTIFICADO:
-- - Mensagens humanas do Telegram sendo salvas como 'outbound' com 'sender_type = human'
-- - Mensagens IA possivelmente sendo salvas como 'inbound'
--
-- CORREÇÕES:
-- 1. Mensagens humanas de Telegram devem ser SEMPRE 'inbound' + 'human'
-- 2. Mensagens IA devem ser SEMPRE 'outbound' + 'ai'
-- ============================================

-- CORRIGIR: Mensagens humanas marcadas como outbound em conversas do Telegram
-- Essas mensagens devem ser 'inbound' porque foram RECEBIDAS do usuário
UPDATE messages m
SET 
  direction = 'inbound',
  updated_at = NOW()
WHERE m.direction = 'outbound'
  AND m.sender_type = 'human'
  AND EXISTS (
    SELECT 1 
    FROM conversations c 
    WHERE c.id = m.conversation_id
      AND c.channel = 'telegram'
  )
  AND m.created_at >= NOW() - INTERVAL '7 days'; -- Apenas últimos 7 dias para segurança

-- Retornar quantidade corrigida
DO $$
DECLARE
  corrected_count INTEGER;
BEGIN
  GET DIAGNOSTICS corrected_count = ROW_COUNT;
  RAISE NOTICE 'Corrigidas % mensagens humanas de outbound para inbound', corrected_count;
END $$;

-- CORRIGIR: Mensagens IA marcadas como inbound
-- Essas mensagens devem ser 'outbound' porque foram ENVIADAS pela IA
UPDATE messages m
SET 
  direction = 'outbound',
  updated_at = NOW()
WHERE m.direction = 'inbound'
  AND m.sender_type = 'ai'
  AND EXISTS (
    SELECT 1 
    FROM conversations c 
    WHERE c.id = m.conversation_id
      AND c.channel = 'telegram'
  )
  AND m.created_at >= NOW() - INTERVAL '7 days'; -- Apenas últimos 7 dias para segurança

-- Retornar quantidade corrigida
DO $$
DECLARE
  corrected_count INTEGER;
BEGIN
  GET DIAGNOSTICS corrected_count = ROW_COUNT;
  RAISE NOTICE 'Corrigidas % mensagens IA de inbound para outbound', corrected_count;
END $$;

-- CORRIGIR: Mensagens IA com sender_type incorreto
UPDATE messages m
SET 
  sender_type = 'ai',
  updated_at = NOW()
WHERE m.sender_type != 'ai'
  AND m.direction = 'outbound'
  AND EXISTS (
    SELECT 1 
    FROM conversations c 
    WHERE c.id = m.conversation_id
      AND c.channel = 'telegram'
  )
  AND m.content IS NOT NULL
  AND m.created_at >= NOW() - INTERVAL '7 days';

-- CORRIGIR: Mensagens humanas com sender_type incorreto
UPDATE messages m
SET 
  sender_type = 'human',
  updated_at = NOW()
WHERE m.sender_type != 'human'
  AND m.direction = 'inbound'
  AND EXISTS (
    SELECT 1 
    FROM conversations c 
    WHERE c.id = m.conversation_id
      AND c.channel = 'telegram'
  )
  AND m.content IS NOT NULL
  AND m.created_at >= NOW() - INTERVAL '7 days';

-- ============================================
-- RELATÓRIO: Verificar distribuição atual
-- ============================================
SELECT 
  c.channel,
  m.direction,
  m.sender_type,
  COUNT(*) as total
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE c.channel = 'telegram'
  AND m.created_at >= NOW() - INTERVAL '7 days'
GROUP BY c.channel, m.direction, m.sender_type
ORDER BY c.channel, m.direction, m.sender_type;

