-- ============================================
-- TABELA DE CONVITES DE USUÁRIOS
-- ============================================
-- Armazena convites pendentes para novos usuários se juntarem à empresa

CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL, -- Token único para o link de convite
    role VARCHAR(50) NOT NULL DEFAULT 'operator', -- admin, operator, observer
    invited_by UUID NOT NULL REFERENCES user_profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL, -- Data de expiração do convite (ex: 7 dias)
    accepted_at TIMESTAMPTZ, -- Quando o convite foi aceito
    user_id UUID REFERENCES user_profiles(id), -- ID do usuário após aceitar
    is_active BOOLEAN DEFAULT true, -- Se o convite ainda está ativo
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, email, is_active) -- Um convite ativo por email por empresa
);

CREATE INDEX idx_user_invitations_company ON user_invitations(company_id);
CREATE INDEX idx_user_invitations_token ON user_invitations(token) WHERE is_active = true;
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_active ON user_invitations(company_id, is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver convites de suas empresas
CREATE POLICY "Users can view invitations of their companies"
ON user_invitations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = user_invitations.company_id
        AND user_id = auth.uid()
        AND is_active = true
    )
);

-- Policy: Apenas admins podem criar convites
CREATE POLICY "Admins can create invitations"
ON user_invitations FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = user_invitations.company_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
);

-- Policy: Apenas admins podem atualizar convites
CREATE POLICY "Admins can update invitations"
ON user_invitations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = user_invitations.company_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
);

-- Trigger para updated_at (se a função existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_user_invitations_updated_at
        BEFORE UPDATE ON user_invitations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;
