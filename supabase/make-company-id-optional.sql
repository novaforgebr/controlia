-- ============================================
-- Script para tornar company_id opcional em contatos, conversas e mensagens
-- Isso permite que o sistema funcione sem company_id obrigatório
-- ============================================

-- 1. Tornar company_id opcional em contacts
ALTER TABLE contacts 
  ALTER COLUMN company_id DROP NOT NULL;

-- Atualizar constraint para permitir NULL
-- (A constraint de foreign key já permite NULL por padrão)

-- 2. Tornar company_id opcional em conversations
ALTER TABLE conversations 
  ALTER COLUMN company_id DROP NOT NULL;

-- Atualizar constraint para permitir NULL
-- (A constraint de foreign key já permite NULL por padrão)

-- 3. Tornar company_id opcional em messages
ALTER TABLE messages 
  ALTER COLUMN company_id DROP NOT NULL;

-- Atualizar constraint para permitir NULL
-- (A constraint de foreign key já permite NULL por padrão)

-- 4. Ajustar índices para suportar NULL
-- Os índices existentes já funcionam com NULL, mas podemos criar índices parciais se necessário

-- Índice para conversas sem company_id
CREATE INDEX IF NOT EXISTS idx_conversations_no_company 
  ON conversations(contact_id, channel, status) 
  WHERE company_id IS NULL;

-- Índice para mensagens sem company_id
CREATE INDEX IF NOT EXISTS idx_messages_no_company 
  ON messages(conversation_id, created_at DESC) 
  WHERE company_id IS NULL;

-- 5. Comentários para documentação
COMMENT ON COLUMN contacts.company_id IS 'ID da empresa (opcional - pode ser NULL)';
COMMENT ON COLUMN conversations.company_id IS 'ID da empresa (opcional - pode ser NULL)';
COMMENT ON COLUMN messages.company_id IS 'ID da empresa (opcional - pode ser NULL)';

-- ============================================
-- IMPORTANTE: Após executar este script
-- ============================================
-- 1. Verifique se não há dados órfãos (contatos/conversas sem company_id que deveriam ter)
-- 2. Considere criar uma empresa padrão para dados existentes se necessário
-- 3. Teste as queries que dependem de company_id para garantir que funcionam com NULL

