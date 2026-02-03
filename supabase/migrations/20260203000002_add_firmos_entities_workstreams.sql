-- Migration: FirmOS Entities, Engagements, Workstreams, Handoffs, Deadlines
-- Purpose: Complete the FirmOS data model with client entities and workflow tracking
-- Depends on: 20260203000001_create_firmos_core_tables.sql

-- =============================================================================
-- ENTITIES TABLE (Clients/Companies)
-- =============================================================================

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name TEXT NOT NULL,
    legal_name TEXT,
    entity_type TEXT CHECK (entity_type IN ('company', 'partnership', 'sole_trader', 'trust', 'ngo', 'public_body')),
    
    -- Jurisdiction
    jurisdiction VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('MT', 'RW')),
    
    -- Identifiers
    registration_number TEXT,
    tin TEXT, -- Tax Identification Number
    vat_number TEXT,
    
    -- Contact
    primary_email TEXT,
    primary_phone TEXT,
    registered_address TEXT,
    
    -- Fiscal year
    year_end_month INTEGER CHECK (year_end_month >= 1 AND year_end_month <= 12),
    year_end_day INTEGER CHECK (year_end_day >= 1 AND year_end_day <= 31),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('prospect', 'active', 'inactive', 'archived')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_jurisdiction ON entities(jurisdiction);
CREATE INDEX idx_entities_status ON entities(status);
CREATE INDEX idx_entities_tin ON entities(tin);
CREATE INDEX idx_entities_year_end ON entities(year_end_month, year_end_day);

-- Full-text search
CREATE INDEX idx_entities_search ON entities USING gin(to_tsvector('english', name || ' ' || COALESCE(legal_name, '')));

-- =============================================================================
-- ENGAGEMENTS TABLE
-- =============================================================================

CREATE TYPE engagement_status AS ENUM (
    'draft',
    'active',
    'in_progress',
    'pending_review',
    'pending_approval',
    'completed',
    'cancelled',
    'on_hold'
);

CREATE TABLE IF NOT EXISTS engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Client reference
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE RESTRICT,
    
    -- Service details
    service_type TEXT NOT NULL,
    service_id TEXT, -- Reference to service catalog
    
    -- Period
    period TEXT NOT NULL, -- e.g., "2026-Q1", "FY2025", "2026-01"
    period_start DATE,
    period_end DATE,
    
    -- Assignment
    primary_agent TEXT NOT NULL, -- e.g., "sofia", "matthew"
    secondary_agents TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status
    status engagement_status NOT NULL DEFAULT 'draft',
    
    -- Timing
    due_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Financial
    fee_amount NUMERIC(12, 2),
    fee_currency TEXT DEFAULT 'EUR',
    billing_status TEXT DEFAULT 'unbilled' CHECK (billing_status IN ('unbilled', 'billed', 'paid', 'overdue')),
    
    -- Notes
    description TEXT,
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_engagements_entity ON engagements(entity_id);
CREATE INDEX idx_engagements_service ON engagements(service_type);
CREATE INDEX idx_engagements_status ON engagements(status);
CREATE INDEX idx_engagements_primary_agent ON engagements(primary_agent);
CREATE INDEX idx_engagements_due_date ON engagements(due_date);
CREATE INDEX idx_engagements_period ON engagements(period);

-- =============================================================================
-- WORKSTREAMS TABLE (Tasks within engagements)
-- =============================================================================

CREATE TYPE workstream_status AS ENUM (
    'pending',
    'in_progress',
    'blocked',
    'pending_qc',
    'qc_revision',
    'pending_approval',
    'completed',
    'cancelled'
);

CREATE TYPE workstream_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);

CREATE TABLE IF NOT EXISTS workstreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent engagement
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    
    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL, -- e.g., "vat_return", "journal_entry", "audit_planning"
    
    -- Assignment
    assigned_agent TEXT NOT NULL,
    
    -- Status and priority
    status workstream_status NOT NULL DEFAULT 'pending',
    priority workstream_priority NOT NULL DEFAULT 'normal',
    
    -- Timing
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Dependencies
    depends_on UUID[] DEFAULT ARRAY[]::UUID[], -- Other workstream IDs
    
    -- QC tracking
    qc_required BOOLEAN DEFAULT TRUE,
    qc_result_id UUID REFERENCES qc_results(id),
    
    -- Output
    output_document_ids UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workstreams_engagement ON workstreams(engagement_id);
CREATE INDEX idx_workstreams_assigned_agent ON workstreams(assigned_agent);
CREATE INDEX idx_workstreams_status ON workstreams(status);
CREATE INDEX idx_workstreams_priority ON workstreams(priority);
CREATE INDEX idx_workstreams_due_date ON workstreams(due_date);
CREATE INDEX idx_workstreams_task_type ON workstreams(task_type);

-- =============================================================================
-- HANDOFFS TABLE (Inter-agent work transfers)
-- =============================================================================

CREATE TYPE handoff_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'completed',
    'cancelled'
);

CREATE TABLE IF NOT EXISTS handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agents
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    
    -- Context
    workstream_id UUID REFERENCES workstreams(id) ON DELETE SET NULL,
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    
    -- Handoff details
    reason TEXT NOT NULL,
    context TEXT, -- Instructions or notes for receiving agent
    
    -- Status
    status handoff_status NOT NULL DEFAULT 'pending',
    
    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Response
    response_notes TEXT
);

-- Indexes
CREATE INDEX idx_handoffs_from_agent ON handoffs(from_agent);
CREATE INDEX idx_handoffs_to_agent ON handoffs(to_agent);
CREATE INDEX idx_handoffs_status ON handoffs(status);
CREATE INDEX idx_handoffs_workstream ON handoffs(workstream_id);
CREATE INDEX idx_handoffs_created_at ON handoffs(created_at DESC);

-- =============================================================================
-- DEADLINES TABLE
-- =============================================================================

CREATE TYPE deadline_status AS ENUM (
    'upcoming',
    'pending',
    'in_progress',
    'completed',
    'missed',
    'waived'
);

CREATE TABLE IF NOT EXISTS deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entity (optional - some deadlines are general)
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    
    -- Deadline details
    title TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    deadline_type TEXT NOT NULL, -- e.g., "vat_return", "annual_accounts", "mbr_filing"
    jurisdiction VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('MT', 'RW')),
    
    -- Date
    due_date DATE NOT NULL,
    
    -- Assignment
    assigned_agent TEXT,
    
    -- Status
    status deadline_status NOT NULL DEFAULT 'upcoming',
    
    -- Linked engagement/workstream
    engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
    workstream_id UUID REFERENCES workstreams(id) ON DELETE SET NULL,
    
    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by TEXT,
    
    -- Alerts
    alert_days_before INTEGER[] DEFAULT ARRAY[7, 3, 1]::INTEGER[],
    last_alert_sent TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deadlines_entity ON deadlines(entity_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX idx_deadlines_status ON deadlines(status);
CREATE INDEX idx_deadlines_jurisdiction ON deadlines(jurisdiction);
CREATE INDEX idx_deadlines_assigned_agent ON deadlines(assigned_agent);
CREATE INDEX idx_deadlines_type ON deadlines(deadline_type);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagements_updated_at
    BEFORE UPDATE ON engagements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workstreams_updated_at
    BEFORE UPDATE ON workstreams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deadlines_updated_at
    BEFORE UPDATE ON deadlines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- View policies
CREATE POLICY staff_view_entities ON entities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_engagements ON engagements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_workstreams ON workstreams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_handoffs ON handoffs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_deadlines ON deadlines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

-- Insert policies (for system/agent use)
CREATE POLICY system_insert_entities ON entities FOR INSERT WITH CHECK (TRUE);
CREATE POLICY system_insert_engagements ON engagements FOR INSERT WITH CHECK (TRUE);
CREATE POLICY system_insert_workstreams ON workstreams FOR INSERT WITH CHECK (TRUE);
CREATE POLICY system_insert_handoffs ON handoffs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY system_insert_deadlines ON deadlines FOR INSERT WITH CHECK (TRUE);

-- Update policies
CREATE POLICY staff_update_entities ON entities FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_engagements ON engagements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_workstreams ON workstreams FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_handoffs ON handoffs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_deadlines ON deadlines FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE entities IS 'Client companies and organizations managed by FirmOS';
COMMENT ON TABLE engagements IS 'Service engagements for entities (e.g., annual audit, tax return)';
COMMENT ON TABLE workstreams IS 'Individual tasks within an engagement';
COMMENT ON TABLE handoffs IS 'Work transfers between FirmOS agents';
COMMENT ON TABLE deadlines IS 'Regulatory and internal deadlines for entities';

COMMENT ON COLUMN entities.jurisdiction IS 'MT = Malta, RW = Rwanda';
COMMENT ON COLUMN entities.year_end_month IS 'Month of fiscal year end (1-12)';
COMMENT ON COLUMN engagements.period IS 'Reference period e.g. FY2025, 2026-Q1';
COMMENT ON COLUMN workstreams.qc_required IS 'Whether this workstream needs QC review';
COMMENT ON COLUMN deadlines.alert_days_before IS 'Days before due date to send alerts';
