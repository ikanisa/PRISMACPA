-- Migration: Approvals Schema
-- Purpose: Maker-checker workflow for Malta tax operations

-- Enum for approval types
CREATE TYPE approval_type AS ENUM (
  'prepare',    -- Initial preparation
  'review',     -- Independent review
  'file',       -- Filing approval
  'pay'         -- Payment approval
);

-- Enum for target types
CREATE TYPE approval_target_type AS ENUM (
  'evidence_entry',
  'evidence_pack',
  'vat_period',
  'vat_draft',
  'bank_match',
  'str_report'
);

-- Enum for approval status
CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

-- Approvals table
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target reference
  target_type approval_target_type NOT NULL,
  target_id UUID NOT NULL,
  
  -- Approval details
  approval_type approval_type NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  
  -- Workflow tracking
  sequence_number INTEGER NOT NULL DEFAULT 1,  -- For multi-step approvals
  
  -- Requestor
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Approver
  assigned_to UUID,  -- Optional assignment
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Decision details
  decision_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate pending approvals
  CONSTRAINT unique_pending_approval UNIQUE NULLS NOT DISTINCT (target_type, target_id, approval_type, status)
    WHERE (status = 'pending')
);

-- Approval audit log
CREATE TABLE approval_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  
  -- Change tracking
  action TEXT NOT NULL,  -- 'created', 'approved', 'rejected', 'reassigned'
  old_status approval_status,
  new_status approval_status,
  
  -- Actor
  actor_id UUID NOT NULL,
  actor_ip INET,
  
  -- Details
  notes TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_approvals_target ON approvals(target_type, target_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_assigned ON approvals(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_approvals_pending ON approvals(status) WHERE status = 'pending';
CREATE INDEX idx_approval_audit_log_approval ON approval_audit_log(approval_id);

-- Updated_at trigger
CREATE TRIGGER update_approvals_updated_at
  BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_approval_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    INSERT INTO approval_audit_log (
      approval_id, action, old_status, new_status, actor_id
    ) VALUES (
      NEW.id,
      CASE NEW.status
        WHEN 'approved' THEN 'approved'
        WHEN 'rejected' THEN 'rejected'
        WHEN 'cancelled' THEN 'cancelled'
        ELSE 'updated'
      END,
      OLD.status,
      NEW.status,
      COALESCE(NEW.approved_by, auth.uid())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_approval_audit
  AFTER UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION log_approval_changes();

-- RLS Policies
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Staff/Admin can view all approvals
CREATE POLICY approvals_select ON approvals
  FOR SELECT
  USING (
    requested_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Policy: Users can create approval requests
CREATE POLICY approvals_insert ON approvals
  FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Policy: Assigned user or admin can update
CREATE POLICY approvals_update ON approvals
  FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Audit log follows approval access
CREATE POLICY approval_audit_log_select ON approval_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM approvals a
      WHERE a.id = approval_id
    )
  );

-- Comments
COMMENT ON TABLE approvals IS 'Maker-checker approval workflow for Malta tax operations';
COMMENT ON TABLE approval_audit_log IS 'Immutable audit trail for approval decisions';
COMMENT ON COLUMN approvals.sequence_number IS 'Order in multi-step approval chains';
