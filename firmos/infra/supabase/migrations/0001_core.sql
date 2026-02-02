-- FirmOS Core Schema Migration
-- Version: 0001
-- Description: Initial schema for FirmOS multi-agent system

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE jurisdiction AS ENUM ('MT', 'RW');

CREATE TYPE service_type AS ENUM (
    'AUDIT', 'TAX', 'ACCOUNTING', 'ADVISORY', 'RISK', 'CSP', 'PRIVATE_NOTARY'
);

CREATE TYPE autonomy_tier AS ENUM ('A', 'B', 'C');

CREATE TYPE task_status AS ENUM (
    'pending', 'in_progress', 'blocked', 'guardian_review', 
    'escalated', 'completed', 'cancelled'
);

CREATE TYPE workstream_status AS ENUM (
    'draft', 'active', 'guardian_pending', 'escalated', 'completed', 'archived'
);

CREATE TYPE escalation_status AS ENUM (
    'pending', 'acknowledged', 'resolved', 'rejected'
);

CREATE TYPE document_status AS ENUM (
    'draft', 'pending_review', 'approved', 'released', 'superseded'
);

CREATE TYPE party_type AS ENUM (
    'director', 'shareholder', 'ubo', 'authorized_signatory', 'contact', 'other'
);

CREATE TYPE evidence_link_target AS ENUM (
    'workstream', 'task', 'artifact', 'document'
);

CREATE TYPE escalation_severity AS ENUM (
    'low', 'medium', 'high', 'critical'
);

CREATE TYPE event_type AS ENUM (
    'engagement_created', 'workstream_created', 'task_created', 
    'task_status_changed', 'document_created', 'document_version_created',
    'evidence_ingested', 'evidence_linked', 'guardian_check_run',
    'decision_made', 'escalation_created', 'escalation_resolved',
    'release_authorized', 'release_blocked'
);

CREATE TYPE agent_domain AS ENUM ('global', 'malta', 'rwanda');

CREATE TYPE pack_id AS ENUM ('mt_tax', 'mt_csp', 'rw_tax', 'rw_private_notary');

-- =============================================================================
-- OPERATOR (Single Human)
-- =============================================================================

CREATE TABLE operator (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- CLIENTS & PARTIES
-- =============================================================================

CREATE TABLE client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    jurisdiction jurisdiction NOT NULL,
    tax_id TEXT,
    email TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE party (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    type party_type NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_party_client ON party(client_id);

-- =============================================================================
-- ENGAGEMENT HIERARCHY
-- =============================================================================

CREATE TABLE engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    service_type service_type NOT NULL,
    jurisdiction jurisdiction NOT NULL,
    pack_id pack_id NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_engagement_client ON engagement(client_id);
CREATE INDEX idx_engagement_pack ON engagement(pack_id);

CREATE TABLE workstream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    engagement_id UUID NOT NULL REFERENCES engagement(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    program_id TEXT,
    status workstream_status NOT NULL DEFAULT 'draft',
    assigned_agent TEXT,
    autonomy_tier autonomy_tier,
    due_date DATE,
    guardian_pass BOOLEAN,
    guardian_report_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workstream_engagement ON workstream(engagement_id);
CREATE INDEX idx_workstream_agent ON workstream(assigned_agent);

CREATE TABLE task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID NOT NULL REFERENCES workstream(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'pending',
    assigned_agent TEXT,
    autonomy_tier autonomy_tier NOT NULL DEFAULT 'B',
    required_outputs TEXT[] DEFAULT '{}',
    required_evidence_types TEXT[] DEFAULT '{}',
    task_order INTEGER DEFAULT 0,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_workstream ON task(workstream_id);
CREATE INDEX idx_task_status ON task(status);

-- =============================================================================
-- ARTIFACTS & DOCUMENTS
-- =============================================================================

CREATE TABLE artifact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID NOT NULL REFERENCES workstream(id) ON DELETE CASCADE,
    task_id UUID REFERENCES task(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    status document_status NOT NULL DEFAULT 'draft',
    created_by_agent TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artifact_workstream ON artifact(workstream_id);

CREATE TABLE document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id UUID NOT NULL REFERENCES artifact(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    current_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_artifact ON document(artifact_id);

CREATE TABLE document_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    hash TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_by_agent TEXT NOT NULL,
    previous_version_id UUID REFERENCES document_version(id),
    changelog TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_docversion_document ON document_version(document_id);

-- =============================================================================
-- EVIDENCE
-- =============================================================================

CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    hash TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    source_system TEXT,
    metadata JSONB DEFAULT '{}',
    verified_at TIMESTAMPTZ,
    verified_by_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_hash ON evidence(hash);

CREATE TABLE evidence_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    target_type evidence_link_target NOT NULL,
    target_id UUID NOT NULL,
    relationship TEXT NOT NULL,
    created_by_agent TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidencelink_evidence ON evidence_link(evidence_id);
CREATE INDEX idx_evidencelink_target ON evidence_link(target_type, target_id);

-- =============================================================================
-- AUTONOMY & ESCALATION
-- =============================================================================

CREATE TABLE decision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID REFERENCES workstream(id) ON DELETE SET NULL,
    task_id UUID REFERENCES task(id) ON DELETE SET NULL,
    requested_by TEXT NOT NULL,
    decided_by TEXT NOT NULL,
    tier autonomy_tier NOT NULL,
    action TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    inputs JSONB NOT NULL DEFAULT '{}',
    approved BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_decision_workstream ON decision(workstream_id);

CREATE TABLE escalation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID REFERENCES workstream(id) ON DELETE SET NULL,
    task_id UUID REFERENCES task(id) ON DELETE SET NULL,
    decision_id UUID REFERENCES decision(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    escalated_by TEXT NOT NULL,
    severity escalation_severity NOT NULL,
    status escalation_status NOT NULL DEFAULT 'pending',
    operator_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escalation_status ON escalation(status);

-- =============================================================================
-- GUARDIAN REPORTS
-- =============================================================================

CREATE TABLE guardian_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID NOT NULL REFERENCES workstream(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    checks JSONB NOT NULL DEFAULT '[]',
    generated_by_agent TEXT NOT NULL,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guardianreport_workstream ON guardian_report(workstream_id);

-- Add FK from workstream to guardian_report
ALTER TABLE workstream 
ADD CONSTRAINT fk_workstream_guardian_report 
FOREIGN KEY (guardian_report_id) REFERENCES guardian_report(id);

-- =============================================================================
-- EVENT LOG (Append-Only)
-- =============================================================================

CREATE TABLE event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type event_type NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    agent_id TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_eventlog_entity ON event_log(entity_type, entity_id);
CREATE INDEX idx_eventlog_type ON event_log(event_type);
CREATE INDEX idx_eventlog_created ON event_log(created_at);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER tr_operator_updated BEFORE UPDATE ON operator FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_client_updated BEFORE UPDATE ON client FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_party_updated BEFORE UPDATE ON party FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_engagement_updated BEFORE UPDATE ON engagement FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_workstream_updated BEFORE UPDATE ON workstream FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_task_updated BEFORE UPDATE ON task FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_artifact_updated BEFORE UPDATE ON artifact FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_document_updated BEFORE UPDATE ON document FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_escalation_updated BEFORE UPDATE ON escalation FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to log events
CREATE OR REPLACE FUNCTION log_event(
    p_event_type event_type,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_agent_id TEXT,
    p_previous_state JSONB DEFAULT NULL,
    p_new_state JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO event_log (event_type, entity_type, entity_id, agent_id, previous_state, new_state, metadata)
    VALUES (p_event_type, p_entity_type, p_entity_id, p_agent_id, p_previous_state, p_new_state, p_metadata)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;
