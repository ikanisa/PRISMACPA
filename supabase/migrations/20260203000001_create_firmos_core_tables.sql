-- Migration: FirmOS Core Tables
-- Purpose: Core tables for FirmOS multi-agent system - cases, audit log, incidents, releases, delegations
-- Aligns with: apps/api/src/schemas/core.ts

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Case status enum
CREATE TYPE case_status AS ENUM (
    'intake',
    'active',
    'in_progress',
    'pending_review',
    'completed',
    'archived'
);

-- Incident type enum
CREATE TYPE incident_type AS ENUM (
    'security',
    'compliance',
    'operational',
    'policy'
);

-- Incident severity enum
CREATE TYPE incident_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
);

-- Incident status enum
CREATE TYPE incident_status AS ENUM (
    'open',
    'investigating',
    'resolved',
    'closed'
);

-- Release type enum
CREATE TYPE release_type AS ENUM (
    'template',
    'policy',
    'workflow',
    'service'
);

-- Release status enum
CREATE TYPE release_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'deployed'
);

-- Release priority enum
CREATE TYPE release_priority AS ENUM (
    'critical',
    'high',
    'normal'
);

-- Delegation status enum
CREATE TYPE delegation_status AS ENUM (
    'pending',
    'active',
    'completed',
    'cancelled'
);

-- =============================================================================
-- CASES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Client information
    client_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    
    -- Jurisdiction and service
    jurisdiction VARCHAR(2) CHECK (jurisdiction IN ('MT', 'RW')),
    service_type TEXT NOT NULL,
    
    -- Status tracking
    status case_status NOT NULL DEFAULT 'intake',
    
    -- Agent assignment
    assigned_agent TEXT NOT NULL,
    
    -- Timing
    due_date TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_jurisdiction ON cases(jurisdiction);
CREATE INDEX idx_cases_assigned_agent ON cases(assigned_agent);
CREATE INDEX idx_cases_due_date ON cases(due_date);

-- =============================================================================
-- AUDIT LOG TABLE (IMMUTABLE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- When it happened
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- What happened
    action TEXT NOT NULL,
    
    -- Who did it
    actor TEXT NOT NULL, -- Agent name or 'operator'
    actor_type TEXT NOT NULL CHECK (actor_type IN ('agent', 'operator', 'system')),
    
    -- What it affected
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    
    -- Details
    details JSONB DEFAULT '{}',
    previous_state JSONB,
    new_state JSONB,
    
    -- Context
    session_id UUID,
    workstream_id UUID,
    engagement_id UUID,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT
);

-- Indexes for common queries
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_actor ON audit_log(actor);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_workstream ON audit_log(workstream_id);

-- Prevent updates and deletes (immutable)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- =============================================================================
-- INCIDENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Incident classification
    type incident_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity incident_severity NOT NULL DEFAULT 'medium',
    
    -- Reporter
    reporter TEXT NOT NULL, -- Agent name
    
    -- Status tracking
    status incident_status NOT NULL DEFAULT 'open',
    
    -- Impact
    affected_clients INTEGER DEFAULT 0,
    affected_workstreams UUID[] DEFAULT ARRAY[]::UUID[],
    jurisdiction VARCHAR(2) CHECK (jurisdiction IN ('MT', 'RW')),
    
    -- Resolution
    resolution TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Root cause
    root_cause TEXT,
    preventive_actions JSONB DEFAULT '[]',
    
    -- Timestamps
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at DESC);
CREATE INDEX idx_incidents_jurisdiction ON incidents(jurisdiction);

-- =============================================================================
-- RELEASES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Release identification
    type release_type NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    
    -- Request details
    requested_by TEXT NOT NULL, -- Agent name
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Scope
    jurisdiction VARCHAR(2) CHECK (jurisdiction IN ('MT', 'RW')),
    target_pack TEXT,
    
    -- Status
    status release_status NOT NULL DEFAULT 'pending',
    priority release_priority NOT NULL DEFAULT 'normal',
    
    -- Quality gates
    qc_passed BOOLEAN DEFAULT FALSE,
    qc_report_id UUID,
    
    -- Change details
    change_log TEXT,
    affected_components JSONB DEFAULT '[]',
    
    -- Authorization
    authorized_by TEXT,
    authorized_at TIMESTAMPTZ,
    authorization_notes TEXT,
    
    -- Deployment
    deployed_at TIMESTAMPTZ,
    deployment_notes TEXT,
    
    -- Rollback info
    can_rollback BOOLEAN DEFAULT TRUE,
    rollback_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_releases_type ON releases(type);
CREATE INDEX idx_releases_status ON releases(status);
CREATE INDEX idx_releases_priority ON releases(priority);
CREATE INDEX idx_releases_requested_at ON releases(requested_at DESC);
CREATE INDEX idx_releases_jurisdiction ON releases(jurisdiction);

-- =============================================================================
-- DELEGATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agents involved
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    
    -- Task details
    task_type TEXT NOT NULL,
    task_description TEXT,
    
    -- Status
    status delegation_status NOT NULL DEFAULT 'pending',
    
    -- Context
    workstream_id UUID,
    engagement_id UUID,
    client_name TEXT,
    
    -- Timing
    delegated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    
    -- Notes
    delegation_reason TEXT,
    completion_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_delegations_from ON delegations(from_agent);
CREATE INDEX idx_delegations_to ON delegations(to_agent);
CREATE INDEX idx_delegations_status ON delegations(status);
CREATE INDEX idx_delegations_workstream ON delegations(workstream_id);
CREATE INDEX idx_delegations_delegated_at ON delegations(delegated_at DESC);

-- =============================================================================
-- POLICY DECISIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS policy_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Decision identification
    policy_id TEXT NOT NULL,
    policy_name TEXT NOT NULL,
    
    -- Context
    jurisdiction VARCHAR(2) CHECK (jurisdiction IN ('MT', 'RW')),
    pack TEXT,
    
    -- Decision details
    decided_by TEXT NOT NULL, -- Usually 'marco'
    decision TEXT NOT NULL CHECK (decision IN ('approve', 'deny', 'escalate')),
    reasoning TEXT,
    
    -- Inputs used
    inputs JSONB DEFAULT '{}',
    rule_version TEXT,
    
    -- Request details
    requested_by TEXT NOT NULL, -- Agent name
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Affected entities
    workstream_id UUID,
    engagement_id UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_policy_decisions_policy ON policy_decisions(policy_id);
CREATE INDEX idx_policy_decisions_jurisdiction ON policy_decisions(jurisdiction);
CREATE INDEX idx_policy_decisions_decided_by ON policy_decisions(decided_by);
CREATE INDEX idx_policy_decisions_decision ON policy_decisions(decision);
CREATE INDEX idx_policy_decisions_requested_at ON policy_decisions(requested_at DESC);

-- =============================================================================
-- QC RESULTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS qc_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Target
    workpaper_id UUID NOT NULL,
    workstream_id UUID,
    
    -- Gate details
    gate_type TEXT NOT NULL,
    gate_version TEXT,
    
    -- Results
    passed BOOLEAN NOT NULL,
    score NUMERIC(5, 2), -- 0.00 to 100.00
    
    -- Checks performed
    checks_performed JSONB DEFAULT '[]',
    checks_passed INTEGER DEFAULT 0,
    checks_failed INTEGER DEFAULT 0,
    checks_warnings INTEGER DEFAULT 0,
    
    -- Details
    findings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    
    -- Agent
    executed_by TEXT NOT NULL, -- Usually 'diane'
    
    -- Timestamps
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_qc_results_workpaper ON qc_results(workpaper_id);
CREATE INDEX idx_qc_results_workstream ON qc_results(workstream_id);
CREATE INDEX idx_qc_results_passed ON qc_results(passed);
CREATE INDEX idx_qc_results_executed_at ON qc_results(executed_at DESC);

-- =============================================================================
-- TEMPLATES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    template_id TEXT UNIQUE NOT NULL,
    version TEXT NOT NULL,
    
    -- Metadata
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    
    -- Scope
    jurisdiction VARCHAR(2) CHECK (jurisdiction IN ('MT', 'RW')),
    pack TEXT,
    
    -- Content
    content_path TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('draft', 'pending_qc', 'published', 'deprecated')),
    
    -- Authorship
    created_by TEXT NOT NULL, -- Agent name
    published_by TEXT,
    published_at TIMESTAMPTZ,
    
    -- QC
    qc_passed BOOLEAN DEFAULT FALSE,
    qc_result_id UUID,
    
    -- Usage stats
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_template_id ON templates(template_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_jurisdiction ON templates(jurisdiction);
CREATE INDEX idx_templates_pack ON templates(pack);

-- Full-text search
CREATE INDEX idx_templates_search ON templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- =============================================================================
-- TEMPLATE USAGE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS template_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template reference
    template_id UUID NOT NULL REFERENCES templates(id),
    
    -- Usage context
    workstream_id UUID,
    engagement_id UUID,
    document_id UUID,
    
    -- Agent
    used_by TEXT NOT NULL,
    
    -- Timestamp
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_template_usage_template ON template_usage(template_id);
CREATE INDEX idx_template_usage_used_at ON template_usage(used_at DESC);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for all tables with updated_at
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_releases_updated_at
    BEFORE UPDATE ON releases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delegations_updated_at
    BEFORE UPDATE ON delegations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Staff/Admin can view all records
CREATE POLICY staff_view_cases ON cases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_audit_log ON audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_incidents ON incidents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_releases ON releases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_delegations ON delegations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_policy_decisions ON policy_decisions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_qc_results ON qc_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_templates ON templates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_view_template_usage ON template_usage FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

-- Policy: System can insert all records (for agents)
CREATE POLICY system_insert_audit_log ON audit_log FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_cases ON cases FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_incidents ON incidents FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_releases ON releases FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_delegations ON delegations FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_policy_decisions ON policy_decisions FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_qc_results ON qc_results FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_templates ON templates FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY system_insert_template_usage ON template_usage FOR INSERT
    WITH CHECK (TRUE);

-- Policy: Staff can update (except audit_log which is immutable)
CREATE POLICY staff_update_cases ON cases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_incidents ON incidents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_releases ON releases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_delegations ON delegations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
        )
    );

CREATE POLICY staff_update_templates ON templates FOR UPDATE
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

COMMENT ON TABLE cases IS 'Client engagement cases managed by FirmOS agents';
COMMENT ON TABLE audit_log IS 'Immutable audit trail for all FirmOS operations (compliance critical)';
COMMENT ON TABLE incidents IS 'Security, compliance, and operational incidents';
COMMENT ON TABLE releases IS 'Template, policy, and workflow release tracking';
COMMENT ON TABLE delegations IS 'Agent-to-agent task delegations';
COMMENT ON TABLE policy_decisions IS 'Autonomy policy decisions (Marco agent)';
COMMENT ON TABLE qc_results IS 'Quality control gate results (Diane agent)';
COMMENT ON TABLE templates IS 'Document templates for FirmOS services';
COMMENT ON TABLE template_usage IS 'Template usage tracking for analytics';

COMMENT ON COLUMN audit_log.action IS 'Action type e.g. case_created, document_approved, escalation_resolved';
COMMENT ON COLUMN audit_log.actor_type IS 'Whether actor was an agent, human operator, or system';
COMMENT ON COLUMN releases.qc_passed IS 'Must be TRUE before authorization';
COMMENT ON COLUMN delegations.from_agent IS 'Agent delegating the task (e.g., matthew, sofia)';
COMMENT ON COLUMN delegations.to_agent IS 'Agent receiving the delegation';
