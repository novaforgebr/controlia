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

-- 5. Ajustar políticas RLS para permitir operações quando company_id é NULL
-- ============================================

-- Remover políticas antigas que não permitem NULL
DROP POLICY IF EXISTS "Users can manage contacts of their companies" ON contacts;
DROP POLICY IF EXISTS "Users can manage conversations of their companies" ON conversations;
DROP POLICY IF EXISTS "Users can manage messages of their companies" ON messages;

-- Nova política para contacts: permite operações com company_id OU quando company_id é NULL
CREATE POLICY "Users can manage contacts of their companies or without company"
    ON contacts FOR ALL
    USING (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    )
    WITH CHECK (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    );

-- Nova política para conversations: permite operações com company_id OU quando company_id é NULL
CREATE POLICY "Users can manage conversations of their companies or without company"
    ON conversations FOR ALL
    USING (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    )
    WITH CHECK (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    );

-- Nova política para messages: permite operações com company_id OU quando company_id é NULL
CREATE POLICY "Users can manage messages of their companies or without company"
    ON messages FOR ALL
    USING (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    )
    WITH CHECK (
        company_id IS NULL 
        OR user_belongs_to_company(company_id)
    );

-- 6. Comentários para documentação
COMMENT ON COLUMN contacts.company_id IS 'ID da empresa (opcional - pode ser NULL)';
COMMENT ON COLUMN conversations.company_id IS 'ID da empresa (opcional - pode ser NULL)';
COMMENT ON COLUMN messages.company_id IS 'ID da empresa (opcional - pode ser NULL)';

-- ============================================
-- IMPORTANTE: Após executar este script
-- ============================================
-- 1. Verifique se não há dados órfãos (contatos/conversas sem company_id que deveriam ter)
-- 2. Considere criar uma empresa padrão para dados existentes se necessário
-- 3. Teste as queries que dependem de company_id para garantir que funcionam com NULL
-- 4. As políticas RLS agora permitem operações quando company_id é NULL (útil para webhooks do n8n)

