-- ============================================
-- ATUALIZAÇÃO AUTOMÁTICA DE ESTATÍSTICAS DE CANAIS
-- ============================================

-- Função para atualizar estatísticas de mensagens e conversas por canal
CREATE OR REPLACE FUNCTION update_channel_integration_stats()
RETURNS TRIGGER AS $$
DECLARE
  conv_channel VARCHAR(50);
  conv_company_id UUID;
BEGIN
  -- Buscar canal e company_id da conversa
  SELECT channel, company_id INTO conv_channel, conv_company_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Se encontrou a conversa, atualizar estatísticas
  IF conv_channel IS NOT NULL AND conv_company_id IS NOT NULL THEN
    -- Atualizar total de mensagens
    UPDATE channel_integrations
    SET 
      total_messages = total_messages + 1,
      last_sync_at = NOW()
    WHERE company_id = conv_company_id
      AND channel = conv_channel
      AND status = 'connected';

    -- Se for primeira mensagem da conversa, incrementar total_conversations
    -- (verificar se é a primeira mensagem desta conversa)
    IF NOT EXISTS (
      SELECT 1 FROM messages 
      WHERE conversation_id = NEW.conversation_id 
      AND id != NEW.id
    ) THEN
      UPDATE channel_integrations
      SET total_conversations = total_conversations + 1
      WHERE company_id = conv_company_id
        AND channel = conv_channel
        AND status = 'connected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar estatísticas quando mensagem é inserida
DROP TRIGGER IF EXISTS trigger_update_channel_stats ON messages;
CREATE TRIGGER trigger_update_channel_stats
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_integration_stats();

-- Função para atualizar estatísticas quando conversa é criada
CREATE OR REPLACE FUNCTION update_channel_integration_on_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar total_conversations quando nova conversa é criada
  UPDATE channel_integrations
  SET 
    total_conversations = total_conversations + 1,
    last_sync_at = NOW()
  WHERE company_id = NEW.company_id
    AND channel = NEW.channel
    AND status = 'connected';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar quando conversa é criada
DROP TRIGGER IF EXISTS trigger_update_channel_on_conversation ON conversations;
CREATE TRIGGER trigger_update_channel_on_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_integration_on_conversation();

-- Comentários
COMMENT ON FUNCTION update_channel_integration_stats() IS 'Atualiza estatísticas de mensagens e conversas por canal';
COMMENT ON FUNCTION update_channel_integration_on_conversation() IS 'Atualiza estatísticas quando nova conversa é criada';

