-- Migration: AML Compliance Schema
-- Purpose: Customer Due Diligence and STR tracking for Malta FIAU compliance

-- Enum for CDD risk tier
CREATE TYPE cdd_risk_tier AS ENUM (
  'low',
  'medium',
  'high',
  'pep',           -- Politically Exposed Person
  'sanctioned'     -- On sanctions list
);

-- Enum for CDD status
CREATE TYPE cdd_status AS ENUM (
  'pending',       -- Awaiting review
  'in_progress',   -- Being processed
  'approved',      -- CDD complete
  'expired',       -- Needs refresh
  'rejected'       -- Failed CDD
);

-- Enum for STR status
CREATE TYPE str_status AS ENUM (
  'draft',         -- Being drafted
  'review',        -- Under review
  'submitted',     -- Submitted to FIAU
  'acknowledged',  -- FIAU acknowledged receipt
  'closed'         -- Case closed
);

-- Customer/Entity records for CDD
CREATE TABLE cdd_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Entity identification
  entity_type TEXT NOT NULL,  -- 'individual', 'company', 'trust'
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  
  -- Malta identifiers
  id_number TEXT,           -- Passport/ID card
  registration_number TEXT, -- Company registration
  vat_number TEXT,
  
  -- Contact
  address TEXT,
  country CHAR(2) DEFAULT 'MT',
  
  -- Risk assessment
  risk_tier cdd_risk_tier NOT NULL DEFAULT 'low',
  risk_score INTEGER,  -- 0-100
  risk_factors JSONB DEFAULT '[]',
  
  -- Status
  status cdd_status NOT NULL DEFAULT 'pending',
  
  -- Review dates
  last_review_date DATE,
  next_review_date DATE,
  review_frequency_months INTEGER DEFAULT 12,
  
  -- Documents
  documents_verified BOOLEAN DEFAULT FALSE,
  document_expiry_date DATE,
  
  -- Assigned officer
  assigned_to UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CDD documents (verification records)
CREATE TABLE cdd_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  cdd_record_id UUID NOT NULL REFERENCES cdd_records(id) ON DELETE CASCADE,
  
  -- Document details
  document_type TEXT NOT NULL,  -- 'passport', 'utility_bill', 'company_registration'
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Storage
  storage_path TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suspicious Transaction Reports
CREATE TABLE str_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference
  internal_reference TEXT NOT NULL,
  fiau_reference TEXT,  -- After submission
  
  -- Subject
  cdd_record_id UUID REFERENCES cdd_records(id),
  subject_name TEXT NOT NULL,
  subject_details JSONB,
  
  -- Transaction details
  transaction_date DATE,
  transaction_amount NUMERIC(15, 2),
  transaction_currency CHAR(3) DEFAULT 'EUR',
  transaction_description TEXT,
  
  -- Suspicion details
  suspicion_type TEXT NOT NULL,
  suspicion_indicators JSONB DEFAULT '[]',
  narrative TEXT NOT NULL,
  
  -- Evidence
  supporting_evidence_ids UUID[] DEFAULT '{}',
  
  -- Status
  status str_status NOT NULL DEFAULT 'draft',
  
  -- Workflow
  drafted_by UUID NOT NULL,
  drafted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  
  -- FIAU response
  fiau_acknowledged_at TIMESTAMPTZ,
  fiau_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AML alerts (automated triggers)
CREATE TABLE aml_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference
  cdd_record_id UUID REFERENCES cdd_records(id),
  
  -- Alert details
  alert_type TEXT NOT NULL,  -- 'large_transaction', 'pattern', 'pep_match', 'sanctions_hit'
  alert_severity TEXT NOT NULL,  -- 'low', 'medium', 'high', 'critical'
  alert_description TEXT NOT NULL,
  
  -- Trigger data
  trigger_data JSONB,
  
  -- Status
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_by UUID,
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT,
  
  -- Escalation
  str_report_id UUID REFERENCES str_reports(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cdd_records_status ON cdd_records(status);
CREATE INDEX idx_cdd_records_risk ON cdd_records(risk_tier);
CREATE INDEX idx_cdd_records_review ON cdd_records(next_review_date);
CREATE INDEX idx_cdd_documents_record ON cdd_documents(cdd_record_id);
CREATE INDEX idx_str_reports_status ON str_reports(status);
CREATE INDEX idx_str_reports_subject ON str_reports(cdd_record_id);
CREATE INDEX idx_aml_alerts_cdd ON aml_alerts(cdd_record_id);
CREATE INDEX idx_aml_alerts_pending ON aml_alerts(is_dismissed) WHERE NOT is_dismissed;

-- Updated_at triggers
CREATE TRIGGER update_cdd_records_updated_at
  BEFORE UPDATE ON cdd_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_str_reports_updated_at
  BEFORE UPDATE ON str_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cdd_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cdd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE str_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Only staff/admin can access AML data
CREATE POLICY cdd_records_access ON cdd_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

CREATE POLICY cdd_documents_access ON cdd_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- STR access is more restricted
CREATE POLICY str_reports_access ON str_reports
  FOR SELECT
  USING (
    drafted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'mlro')  -- MLRO = Money Laundering Reporting Officer
    )
  );

CREATE POLICY str_reports_create ON str_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'mlro')
    )
  );

CREATE POLICY str_reports_update ON str_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'mlro')
    )
  );

CREATE POLICY aml_alerts_access ON aml_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff', 'mlro')
    )
  );

-- Comments
COMMENT ON TABLE cdd_records IS 'Customer Due Diligence records for Malta FIAU compliance';
COMMENT ON TABLE cdd_documents IS 'Verification documents for CDD records';
COMMENT ON TABLE str_reports IS 'Suspicious Transaction Reports for FIAU submission';
COMMENT ON TABLE aml_alerts IS 'Automated AML alerts for review';
COMMENT ON COLUMN str_reports.fiau_reference IS 'Reference number assigned by Malta FIAU';
