-- ============================================
-- TABELA DE CAMPOS CUSTOMIZADOS PARA CONTATOS
-- ============================================
-- Esta tabela armazena as definições de campos customizados por empresa
-- Os valores dos campos são armazenados em contacts.custom_fields (JSONB)

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS contact_custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Definição do campo
    field_key VARCHAR(100) NOT NULL, -- Chave única do campo (ex: "empresa", "cargo")
    field_label VARCHAR(255) NOT NULL, -- Label exibido (ex: "Empresa", "Cargo")
    field_type VARCHAR(50) NOT NULL, -- text, number, date, select, textarea, boolean
    field_options JSONB, -- Opções para campos do tipo select (array de strings)
    
    -- Configurações
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0, -- Ordem de exibição
    
    -- Validação
    validation_rules JSONB, -- Regras de validação (min, max, pattern, etc)
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: campo único por empresa
    UNIQUE(company_id, field_key)
);

CREATE INDEX idx_contact_custom_fields_company ON contact_custom_fields(company_id);
CREATE INDEX idx_contact_custom_fields_active ON contact_custom_fields(company_id, is_active);

-- Trigger para atualizar updated_at (criar função se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS update_contact_custom_fields_updated_at ON contact_custom_fields;
CREATE TRIGGER update_contact_custom_fields_updated_at BEFORE UPDATE ON contact_custom_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE contact_custom_fields ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (após criar a tabela)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view custom fields of their companies" ON contact_custom_fields;
    DROP POLICY IF EXISTS "Users can create custom fields in their companies" ON contact_custom_fields;
    DROP POLICY IF EXISTS "Users can update custom fields in their companies" ON contact_custom_fields;
    DROP POLICY IF EXISTS "Users can delete custom fields in their companies" ON contact_custom_fields;
END $$;

-- Policies para contact_custom_fields
CREATE POLICY "Users can view custom fields of their companies"
    ON contact_custom_fields FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create custom fields in their companies"
    ON contact_custom_fields FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update custom fields in their companies"
    ON contact_custom_fields FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can delete custom fields in their companies"
    ON contact_custom_fields FOR DELETE
    USING (
        company_id IN (
            SELECT company_id FROM company_users
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON contact_custom_fields TO authenticated;

