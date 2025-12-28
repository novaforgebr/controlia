-- ============================================
-- HABILITAR REALTIME PARA TODAS AS TABELAS NECESSÁRIAS
-- ============================================
-- Este script habilita o Supabase Realtime para as tabelas:
-- - messages (mensagens)
-- - conversations (conversas)
-- - contacts (contatos - para atualizar custom_fields)
-- ============================================
-- NOTA: Este script é idempotente - pode ser executado múltiplas vezes sem erro
-- ============================================

-- 1. Habilitar Realtime na tabela messages (se ainda não estiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- Configurar REPLICA IDENTITY FULL para messages
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 2. Habilitar Realtime na tabela conversations (se ainda não estiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

-- Configurar REPLICA IDENTITY FULL para conversations
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- 3. Habilitar Realtime na tabela contacts (se ainda não estiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'contacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
  END IF;
END $$;

-- Configurar REPLICA IDENTITY FULL para contacts
ALTER TABLE contacts REPLICA IDENTITY FULL;

-- ============================================
-- VERIFICAÇÃO:
-- ============================================
-- Para verificar se o Realtime está habilitado, execute:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   pubname
-- FROM pg_publication_tables
-- WHERE tablename IN ('messages', 'conversations', 'contacts')
-- ORDER BY tablename;
--
-- Se retornar 3 linhas (uma para cada tabela), o Realtime está habilitado.
-- Se não retornar todas, execute este script novamente.
-- ============================================

