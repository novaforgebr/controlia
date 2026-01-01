-- Script para prevenir mensagens duplicadas
-- Execute este script no Supabase SQL Editor

-- PASSO 1: Identificar e remover duplicatas ANTES de criar o índice único
-- Mantém apenas a mensagem mais antiga de cada grupo duplicado

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Contar duplicatas
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT company_id, conversation_id, channel_message_id
        FROM messages
        WHERE channel_message_id IS NOT NULL
        GROUP BY company_id, conversation_id, channel_message_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Encontradas % grupos de mensagens duplicadas. Removendo duplicatas...', duplicate_count;
        
        -- Remover duplicatas, mantendo apenas a mais antiga (menor ID)
        DELETE FROM messages
        WHERE id IN (
            SELECT id
            FROM (
                SELECT 
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY company_id, conversation_id, channel_message_id 
                        ORDER BY created_at ASC, id ASC
                    ) as row_num
                FROM messages
                WHERE channel_message_id IS NOT NULL
            ) ranked
            WHERE row_num > 1  -- Mantém apenas a primeira (mais antiga)
        );
        
        GET DIAGNOSTICS duplicate_count = ROW_COUNT;
        RAISE NOTICE 'Removidas % mensagens duplicadas.', duplicate_count;
    ELSE
        RAISE NOTICE 'Nenhuma duplicata encontrada.';
    END IF;
END $$;

-- PASSO 2: Remover índice único anterior se existir (caso o script tenha sido executado parcialmente)
DROP INDEX IF EXISTS idx_messages_unique_channel_conversation;

-- PASSO 3: Criar índice único composto para prevenir duplicatas no futuro
-- Isso garante que uma mensagem com o mesmo channel_message_id + conversation_id não seja criada duas vezes
CREATE UNIQUE INDEX idx_messages_unique_channel_conversation 
ON messages(company_id, conversation_id, channel_message_id) 
WHERE channel_message_id IS NOT NULL;

-- PASSO 4: Adicionar comentário explicativo
COMMENT ON INDEX idx_messages_unique_channel_conversation IS 
'Previne duplicação de mensagens com o mesmo channel_message_id na mesma conversa. Garante idempotência nos webhooks.';

-- PASSO 5: Verificar se o índice foi criado corretamente
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'messages' 
    AND indexname = 'idx_messages_unique_channel_conversation';

-- PASSO 6: Verificar se ainda existem duplicatas (deve retornar 0)
SELECT 
    'Mensagens duplicadas restantes: ' || COUNT(*)::TEXT as verificacao
FROM (
    SELECT company_id, conversation_id, channel_message_id
    FROM messages
    WHERE channel_message_id IS NOT NULL
    GROUP BY company_id, conversation_id, channel_message_id
    HAVING COUNT(*) > 1
) duplicates;

