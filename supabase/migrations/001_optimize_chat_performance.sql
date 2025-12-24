-- ============================================
-- OTIMIZAÇÕES DE PERFORMANCE PARA CHAT OMNICHANNEL
-- ============================================

-- 1. Adicionar índices compostos para melhorar queries de conversas ativas
CREATE INDEX IF NOT EXISTS idx_conversations_company_status_ai 
  ON conversations(company_id, status, ai_assistant_enabled) 
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_sender 
  ON messages(conversation_id, created_at DESC, sender_type);

-- 2. Criar tabela de integrações de canais
CREATE TABLE IF NOT EXISTS channel_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identificação do canal
    channel VARCHAR(50) NOT NULL, -- whatsapp, telegram, instagram, etc
    channel_name VARCHAR(255), -- Nome amigável (ex: "WhatsApp Principal")
    
    -- Configuração e status
    status VARCHAR(50) DEFAULT 'disconnected', -- disconnected, connecting, connected, error
    connection_data JSONB DEFAULT '{}'::jsonb, -- Dados da conexão (tokens, IDs, etc)
    
    -- Metadados do n8n
    n8n_instance_id VARCHAR(255), -- ID da instância no n8n/Evolution API
    n8n_webhook_url TEXT, -- Webhook para receber eventos
    n8n_qr_code_url TEXT, -- URL temporária do QR Code
    qr_code_base64 TEXT, -- QR Code em Base64 (temporário)
    
    -- Status de conexão
    connected_at TIMESTAMPTZ,
    disconnected_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    
    -- Estatísticas
    total_messages INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    
    -- Configurações
    auto_reply_enabled BOOLEAN DEFAULT true,
    business_hours_only BOOLEAN DEFAULT false,
    
    -- Auditoria
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garantir uma única integração ativa por canal por empresa
    UNIQUE(company_id, channel, n8n_instance_id)
);

CREATE INDEX idx_channel_integrations_company ON channel_integrations(company_id);
CREATE INDEX idx_channel_integrations_status ON channel_integrations(company_id, status);
CREATE INDEX idx_channel_integrations_channel ON channel_integrations(company_id, channel);

-- 3. Adicionar coluna para configuração de auto-desativar IA
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS settings_ai_auto_disable_on_human_message BOOLEAN DEFAULT true;

-- 4. Função para desativar IA automaticamente quando humano envia mensagem
CREATE OR REPLACE FUNCTION auto_disable_ai_on_human_message()
RETURNS TRIGGER AS $$
DECLARE
  company_settings JSONB;
  should_disable BOOLEAN;
BEGIN
  -- Verificar se a mensagem é de um humano
  IF NEW.sender_type = 'human' THEN
    -- Buscar configuração da empresa
    SELECT settings INTO company_settings
    FROM companies
    WHERE id = NEW.company_id;
    
    -- Verificar se deve desativar IA automaticamente
    should_disable := COALESCE(
      (company_settings->>'settings_ai_auto_disable_on_human_message')::boolean,
      true
    );
    
    IF should_disable THEN
      -- Desativar IA na conversa
      UPDATE conversations
      SET ai_assistant_enabled = false,
          updated_at = NOW()
      WHERE id = NEW.conversation_id
        AND company_id = NEW.company_id
        AND ai_assistant_enabled = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para auto-desativar IA
DROP TRIGGER IF EXISTS trigger_auto_disable_ai_on_human_message ON messages;
CREATE TRIGGER trigger_auto_disable_ai_on_human_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_disable_ai_on_human_message();

-- 5. Habilitar RLS na tabela de integrações
ALTER TABLE channel_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage channel_integrations of their companies"
    ON channel_integrations FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- 6. Trigger para atualizar updated_at
CREATE TRIGGER update_channel_integrations_updated_at 
  BEFORE UPDATE ON channel_integrations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE channel_integrations IS 'Integrações de canais (WhatsApp, Telegram, etc) - gerenciamento de conexões';
COMMENT ON COLUMN channel_integrations.qr_code_base64 IS 'QR Code temporário em Base64 para conexão inicial';
COMMENT ON COLUMN channel_integrations.connection_data IS 'Dados da conexão (tokens, IDs, configurações específicas do canal)';

