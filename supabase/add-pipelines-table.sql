-- ============================================
-- TABELA DE PIPELINES/STAGES
-- ============================================
-- Define os estágios (stages) do pipeline de vendas/CRM

CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuração
    is_default BOOLEAN DEFAULT false, -- Pipeline padrão da empresa
    is_active BOOLEAN DEFAULT true,
    
    -- Ordem
    display_order INTEGER DEFAULT 0,
    
    -- Metadados
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#039155', -- Cor hex para exibição
    
    -- Configuração
    is_closed BOOLEAN DEFAULT false, -- Se este stage representa "fechado/ganho"
    is_lost BOOLEAN DEFAULT false, -- Se este stage representa "perdido"
    
    -- Ordem
    display_order INTEGER DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(pipeline_id, name)
);

-- Adicionar pipeline_id e stage_id aos contatos
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pipelines_company ON pipelines(company_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_default ON pipelines(company_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_company ON pipeline_stages(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline ON contacts(company_id, pipeline_id, pipeline_stage_id);

-- Habilitar RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Policies para pipelines
CREATE POLICY "Users can view pipelines of their companies"
    ON pipelines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = pipelines.company_id
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage pipelines of their companies"
    ON pipelines FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = pipelines.company_id
            AND user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Policies para pipeline_stages
CREATE POLICY "Users can view pipeline stages of their companies"
    ON pipeline_stages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = pipeline_stages.company_id
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage pipeline stages of their companies"
    ON pipeline_stages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = pipeline_stages.company_id
            AND user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

