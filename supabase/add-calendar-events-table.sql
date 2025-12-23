-- ============================================
-- TABELA DE EVENTOS DO CALENDÁRIO
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Identificação
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Data e hora
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Localização
    location TEXT,
    
    -- Relacionamentos
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    
    -- Participantes
    organizer_id UUID NOT NULL REFERENCES user_profiles(id),
    attendees JSONB DEFAULT '[]'::jsonb, -- Array de {user_id, email, name, status}
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, completed
    visibility VARCHAR(50) DEFAULT 'company', -- private, company, public
    
    -- Notificações
    reminder_minutes INTEGER[], -- Array de minutos antes do evento (ex: [15, 60])
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Recorrência
    recurrence_rule TEXT, -- RFC 5545 recurrence rule (RRULE)
    recurrence_until TIMESTAMPTZ,
    parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE, -- Para eventos recorrentes
    
    -- Metadados
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_company ON calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_organizer ON calendar_events(company_id, organizer_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_contact ON calendar_events(company_id, contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(company_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(company_id, status);

-- Habilitar RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies para calendar_events
CREATE POLICY "Users can view calendar events of their companies"
    ON calendar_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = calendar_events.company_id
            AND user_id = auth.uid()
            AND is_active = true
        )
        AND (
            visibility IN ('company', 'public') OR
            organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can create calendar events in their companies"
    ON calendar_events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = calendar_events.company_id
            AND user_id = auth.uid()
            AND is_active = true
        )
        AND organizer_id = auth.uid()
    );

CREATE POLICY "Users can update their own calendar events"
    ON calendar_events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = calendar_events.company_id
            AND user_id = auth.uid()
            AND is_active = true
        )
        AND (
            organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM company_users
                WHERE company_id = calendar_events.company_id
                AND user_id = auth.uid()
                AND role = 'admin'
                AND is_active = true
            )
        )
    );

CREATE POLICY "Users can delete their own calendar events"
    ON calendar_events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM company_users
            WHERE company_id = calendar_events.company_id
            AND user_id = auth.uid()
            AND is_active = true
        )
        AND (
            organizer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM company_users
                WHERE company_id = calendar_events.company_id
                AND user_id = auth.uid()
                AND role = 'admin'
                AND is_active = true
            )
        )
    );

-- Trigger para updated_at
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

