-- ============================================
-- CONTROLIA CRM - SCHEMA MULTI-TENANT
-- ============================================
-- Este schema implementa isolamento completo por empresa (tenant)
-- Todas as tabelas principais incluem company_id para RLS
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca full-text

-- ============================================
-- 1. EMPRESAS (TENANTS)
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    document VARCHAR(50), -- CNPJ/CPF
    email VARCHAR(255),
    phone VARCHAR(50),
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb, -- Configurações específicas da empresa
    subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, pro, enterprise
    subscription_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    subscription_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_active ON companies(is_active);

-- ============================================
-- 2. USUÁRIOS E AUTENTICAÇÃO
-- ============================================
-- Nota: Usuários principais são gerenciados pelo Supabase Auth
-- Esta tabela armazena dados adicionais e relacionamento com empresas

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relacionamento Usuário-Empresa (muitos para muitos)
CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'operator', -- admin, operator, observer, custom
    permissions JSONB DEFAULT '{}'::jsonb, -- Permissões customizadas por módulo
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES user_profiles(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);
CREATE INDEX idx_company_users_active ON company_users(is_active) WHERE is_active = true;

-- ============================================
-- 3. CONTATOS (LEADS/CLIENTES)
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50), -- Número do WhatsApp formatado
    document VARCHAR(50), -- CPF/CNPJ
    
    -- Status e classificação
    status VARCHAR(50) DEFAULT 'lead', -- lead, prospect, client, inactive
    source VARCHAR(100), -- origem do contato (site, indicação, etc)
    score INTEGER DEFAULT 0, -- Score de qualificação
    
    -- Campos customizados (JSONB para flexibilidade)
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Metadados
    notes TEXT,
    tags TEXT[], -- Array de tags
    ai_enabled BOOLEAN DEFAULT true, -- Se IA pode interagir com este contato
    
    -- Auditoria
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_interaction_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_status ON contacts(company_id, status);
CREATE INDEX idx_contacts_whatsapp ON contacts(company_id, whatsapp);
CREATE INDEX idx_contacts_email ON contacts(company_id, email);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_ai_enabled ON contacts(company_id, ai_enabled);
CREATE INDEX idx_contacts_last_interaction ON contacts(company_id, last_interaction_at DESC);

-- ============================================
-- 4. CONVERSAS E ATENDIMENTOS
-- ============================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Canal e identificação
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- whatsapp, email, chat, etc
    channel_thread_id VARCHAR(255), -- ID da thread no canal externo (ex: WhatsApp message ID)
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, closed, transferred, waiting
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Metadados
    subject VARCHAR(500),
    assigned_to UUID REFERENCES user_profiles(id), -- Atendente responsável
    ai_assistant_enabled BOOLEAN DEFAULT true, -- Se IA está ativa nesta conversa
    
    -- Timestamps
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_company ON conversations(company_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(company_id, status);
CREATE INDEX idx_conversations_channel ON conversations(company_id, channel, channel_thread_id);
CREATE INDEX idx_conversations_assigned ON conversations(company_id, assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_conversations_active ON conversations(company_id, status) WHERE status = 'open';

-- ============================================
-- 5. MENSAGENS
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Conteúdo
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, video, document, location
    media_url TEXT, -- URL do arquivo de mídia
    
    -- Origem
    sender_type VARCHAR(20) NOT NULL, -- human, ai, system
    sender_id UUID REFERENCES user_profiles(id), -- Se sender_type = human
    ai_agent_id UUID, -- Se sender_type = ai, referência ao agente usado
    
    -- Metadados do canal
    channel_message_id VARCHAR(255), -- ID da mensagem no canal externo
    channel_timestamp TIMESTAMPTZ,
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    
    -- Status
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
    read_at TIMESTAMPTZ,
    
    -- Contexto da IA (se aplicável)
    ai_context JSONB, -- Contexto usado pela IA para gerar resposta
    ai_prompt_version_id UUID, -- Versão do prompt usado
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_company ON messages(company_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_contact ON messages(contact_id);
CREATE INDEX idx_messages_sender ON messages(company_id, sender_type);
CREATE INDEX idx_messages_ai ON messages(company_id, sender_type) WHERE sender_type = 'ai';
CREATE INDEX idx_messages_channel_id ON messages(company_id, channel_message_id);

-- ============================================
-- 6. INTELIGÊNCIA ARTIFICIAL - PROMPTS
-- ============================================
CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    parent_id UUID REFERENCES ai_prompts(id), -- Para versionamento
    
    -- Conteúdo
    prompt_text TEXT NOT NULL,
    system_prompt TEXT, -- Prompt do sistema (contexto fixo)
    
    -- Configurações
    model VARCHAR(100) DEFAULT 'gpt-4', -- Modelo de IA a usar
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    
    -- Contexto de uso
    context_type VARCHAR(50), -- conversation, contact, general, etc
    channel VARCHAR(50), -- whatsapp, email, etc (NULL = todos)
    
    -- Limites e regras
    allowed_actions JSONB DEFAULT '[]'::jsonb, -- Ações que a IA pode executar
    forbidden_actions JSONB DEFAULT '[]'::jsonb, -- Ações proibidas
    constraints TEXT, -- Regras adicionais em texto livre
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Prompt padrão para o contexto
    
    -- Auditoria
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_prompts_company ON ai_prompts(company_id);
CREATE INDEX idx_ai_prompts_active ON ai_prompts(company_id, is_active) WHERE is_active = true;
CREATE INDEX idx_ai_prompts_context ON ai_prompts(company_id, context_type, channel);
CREATE INDEX idx_ai_prompts_default ON ai_prompts(company_id, is_default) WHERE is_default = true;
CREATE INDEX idx_ai_prompts_parent ON ai_prompts(parent_id);

-- ============================================
-- 7. INTELIGÊNCIA ARTIFICIAL - LOGS E DECISÕES
-- ============================================
CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Contexto
    conversation_id UUID REFERENCES conversations(id),
    contact_id UUID REFERENCES contacts(id),
    message_id UUID REFERENCES messages(id),
    
    -- Agente e prompt
    ai_agent_id VARCHAR(255), -- ID do agente no n8n
    prompt_id UUID REFERENCES ai_prompts(id),
    prompt_version INTEGER,
    
    -- Entrada
    input_context JSONB NOT NULL, -- Contexto enviado para a IA
    user_message TEXT, -- Mensagem do usuário que gerou a resposta
    
    -- Saída
    ai_response TEXT NOT NULL, -- Resposta gerada pela IA
    ai_metadata JSONB, -- Metadados da resposta (tokens, tempo, etc)
    
    -- Decisões
    decisions JSONB, -- Decisões tomadas pela IA (estruturado)
    confidence_score DECIMAL(5,2), -- Score de confiança (0-100)
    
    -- Status
    status VARCHAR(50) DEFAULT 'success', -- success, error, blocked, manual_review
    error_message TEXT,
    
    -- Auditoria
    reviewed_by UUID REFERENCES user_profiles(id), -- Se foi revisado manualmente
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_logs_company ON ai_logs(company_id);
CREATE INDEX idx_ai_logs_conversation ON ai_logs(conversation_id, created_at DESC);
CREATE INDEX idx_ai_logs_contact ON ai_logs(contact_id);
CREATE INDEX idx_ai_logs_prompt ON ai_logs(prompt_id);
CREATE INDEX idx_ai_logs_status ON ai_logs(company_id, status);
CREATE INDEX idx_ai_logs_created ON ai_logs(company_id, created_at DESC);

-- ============================================
-- 8. AUTOMAÇÕES E N8N
-- ============================================
CREATE TABLE automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Integração n8n
    n8n_workflow_id VARCHAR(255), -- ID do workflow no n8n
    n8n_webhook_url TEXT, -- URL do webhook do n8n
    
    -- Configuração
    trigger_event VARCHAR(100) NOT NULL, -- new_message, new_contact, status_change, etc
    trigger_conditions JSONB DEFAULT '{}'::jsonb, -- Condições para disparar
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    
    -- Metadados
    last_executed_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Auditoria
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automations_company ON automations(company_id);
CREATE INDEX idx_automations_active ON automations(company_id, is_active, is_paused);
CREATE INDEX idx_automations_trigger ON automations(company_id, trigger_event);

-- Logs de execução de automações
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    
    -- Contexto do trigger
    trigger_event VARCHAR(100) NOT NULL,
    trigger_data JSONB, -- Dados do evento que disparou
    
    -- Execução
    n8n_execution_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'running', -- running, success, error, cancelled
    execution_time_ms INTEGER,
    
    -- Resultado
    result_data JSONB,
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automation_logs_company ON automation_logs(company_id);
CREATE INDEX idx_automation_logs_automation ON automation_logs(automation_id, created_at DESC);
CREATE INDEX idx_automation_logs_status ON automation_logs(company_id, status);

-- ============================================
-- 9. ARQUIVOS E BASE DE CONHECIMENTO
-- ============================================
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Armazenamento
    storage_path TEXT NOT NULL, -- Caminho no storage (Supabase Storage)
    storage_bucket VARCHAR(100) DEFAULT 'files',
    file_url TEXT NOT NULL, -- URL pública ou assinada
    file_size BIGINT NOT NULL, -- Tamanho em bytes
    mime_type VARCHAR(100),
    
    -- Classificação
    file_type VARCHAR(50), -- document, image, audio, video, knowledge_base
    category VARCHAR(100), -- Categoria customizada
    tags TEXT[],
    
    -- Uso pela IA
    is_knowledge_base BOOLEAN DEFAULT false, -- Se faz parte da base de conhecimento
    is_public BOOLEAN DEFAULT false, -- Se é público ou privado
    
    -- Metadados
    uploaded_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_files_company ON files(company_id);
CREATE INDEX idx_files_type ON files(company_id, file_type);
CREATE INDEX idx_files_knowledge ON files(company_id, is_knowledge_base) WHERE is_knowledge_base = true;
CREATE INDEX idx_files_tags ON files USING GIN(tags);

-- ============================================
-- 10. PAGAMENTOS E FINANCEIRO
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id), -- Se o pagamento está associado a um contato
    
    -- Dados do pagamento
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    description TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded, cancelled
    payment_method VARCHAR(50), -- credit_card, pix, boleto, etc
    payment_gateway VARCHAR(50), -- stripe, asaas, etc
    
    -- Metadados
    external_id VARCHAR(255), -- ID no gateway de pagamento
    due_date DATE,
    paid_at TIMESTAMPTZ,
    
    -- Auditoria
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_contact ON payments(contact_id);
CREATE INDEX idx_payments_status ON payments(company_id, status);
CREATE INDEX idx_payments_due_date ON payments(company_id, due_date);

-- ============================================
-- 11. AUDITORIA E LOGS DE AÇÕES
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Quem
    user_id UUID REFERENCES user_profiles(id), -- NULL se for ação do sistema ou IA
    actor_type VARCHAR(20) NOT NULL, -- human, ai, system
    actor_name VARCHAR(255), -- Nome do ator (para IA ou sistema)
    
    -- O quê
    action VARCHAR(100) NOT NULL, -- create_contact, update_message, ai_response, etc
    entity_type VARCHAR(50) NOT NULL, -- contact, conversation, message, etc
    entity_id UUID, -- ID da entidade afetada
    
    -- Detalhes
    changes JSONB, -- Mudanças realizadas (antes/depois)
    metadata JSONB, -- Metadados adicionais
    
    -- Contexto
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(company_id, user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(company_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(company_id, action);
CREATE INDEX idx_audit_logs_created ON audit_logs(company_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(company_id, actor_type);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em tabelas com updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON ai_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar last_interaction_at do contato
CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts
    SET last_interaction_at = NEW.created_at
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_interaction AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_contact_last_interaction();

-- Função para atualizar last_message_at da conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_message AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- IMPORTANTE: Estas policies garantem isolamento total por empresa

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem seus próprios perfis
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Usuários veem apenas empresas onde são membros
CREATE POLICY "Users can view companies they belong to"
    ON companies FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Policy: Company users - isolamento por empresa
CREATE POLICY "Users can view company_users of their companies"
    ON company_users FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Policy helper: Verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION user_belongs_to_company(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = company_uuid
        AND user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy genérica para todas as tabelas com company_id
-- CONTACTS
CREATE POLICY "Users can manage contacts of their companies"
    ON contacts FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- CONVERSATIONS
CREATE POLICY "Users can manage conversations of their companies"
    ON conversations FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- MESSAGES
CREATE POLICY "Users can manage messages of their companies"
    ON messages FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- AI_PROMPTS
CREATE POLICY "Users can manage ai_prompts of their companies"
    ON ai_prompts FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- AI_LOGS
CREATE POLICY "Users can view ai_logs of their companies"
    ON ai_logs FOR SELECT
    USING (user_belongs_to_company(company_id));

-- AUTOMATIONS
CREATE POLICY "Users can manage automations of their companies"
    ON automations FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- AUTOMATION_LOGS
CREATE POLICY "Users can view automation_logs of their companies"
    ON automation_logs FOR SELECT
    USING (user_belongs_to_company(company_id));

-- FILES
CREATE POLICY "Users can manage files of their companies"
    ON files FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- PAYMENTS
CREATE POLICY "Users can manage payments of their companies"
    ON payments FOR ALL
    USING (user_belongs_to_company(company_id))
    WITH CHECK (user_belongs_to_company(company_id));

-- AUDIT_LOGS
CREATE POLICY "Users can view audit_logs of their companies"
    ON audit_logs FOR SELECT
    USING (user_belongs_to_company(company_id));

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON TABLE companies IS 'Empresas (tenants) - isolamento completo de dados';
COMMENT ON TABLE contacts IS 'Contatos/Leads/Clientes - dados isolados por empresa';
COMMENT ON TABLE conversations IS 'Conversas e atendimentos - agrupamento de mensagens';
COMMENT ON TABLE messages IS 'Mensagens individuais - origem humana ou IA';
COMMENT ON TABLE ai_prompts IS 'Prompts de IA versionados e controlados';
COMMENT ON TABLE ai_logs IS 'Logs completos de todas as ações e decisões da IA';
COMMENT ON TABLE automations IS 'Automações e workflows do n8n';
COMMENT ON TABLE audit_logs IS 'Auditoria completa de todas as ações do sistema';

