-- Migration: Evidence Ledger Schema
-- Purpose: Document intake, hashing, OCR status tracking for Malta tax evidence

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum for evidence entry status
CREATE TYPE evidence_status AS ENUM (
  'pending',      -- Awaiting OCR/extraction
  'extracting',   -- OCR in progress
  'extracted',    -- Fields extracted, needs verification
  'verified',     -- Human verified
  'rejected'      -- Invalid/duplicate
);

-- Enum for evidence source type
CREATE TYPE evidence_source AS ENUM (
  'upload',       -- Manual upload
  'email',        -- Email attachment
  'scan',         -- Physical scan
  'api'           -- External system import
);

-- Evidence entries table
CREATE TABLE evidence_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File metadata
  filename TEXT NOT NULL,
  file_hash TEXT NOT NULL,  -- SHA-256 hash for deduplication
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Source tracking
  source evidence_source NOT NULL DEFAULT 'upload',
  source_reference TEXT,  -- Email ID, scan batch, etc.
  
  -- Classification
  document_type TEXT,  -- invoice, receipt, bank_statement, etc.
  vendor_name TEXT,
  document_date DATE,
  
  -- Extracted amounts (EUR)
  gross_amount NUMERIC(15, 2),
  vat_amount NUMERIC(15, 2),
  net_amount NUMERIC(15, 2),
  
  -- Processing status
  status evidence_status NOT NULL DEFAULT 'pending',
  ocr_confidence NUMERIC(5, 4),  -- 0.0000 to 1.0000
  extraction_metadata JSONB DEFAULT '{}',
  
  -- Period assignment
  vat_period_id UUID,
  pack_id UUID,
  
  -- Ownership and audit
  uploaded_by UUID NOT NULL,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Evidence packs (grouped evidence for a period)
CREATE TABLE evidence_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period association
  vat_period_id UUID NOT NULL,
  
  -- Pack metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Counts (denormalized for performance)
  entry_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  verified_count INTEGER NOT NULL DEFAULT 0,
  
  -- Totals (EUR)
  total_gross NUMERIC(15, 2) DEFAULT 0,
  total_vat NUMERIC(15, 2) DEFAULT 0,
  total_net NUMERIC(15, 2) DEFAULT 0,
  
  -- Approval status
  is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_evidence_entries_status ON evidence_entries(status);
CREATE INDEX idx_evidence_entries_period ON evidence_entries(vat_period_id);
CREATE INDEX idx_evidence_entries_pack ON evidence_entries(pack_id);
CREATE INDEX idx_evidence_entries_hash ON evidence_entries(file_hash);
CREATE INDEX idx_evidence_entries_uploaded_by ON evidence_entries(uploaded_by);
CREATE INDEX idx_evidence_packs_period ON evidence_packs(vat_period_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_evidence_entries_updated_at
  BEFORE UPDATE ON evidence_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evidence_packs_updated_at
  BEFORE UPDATE ON evidence_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE evidence_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_packs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view evidence they uploaded or have access to
CREATE POLICY evidence_entries_select ON evidence_entries
  FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Policy: Users can insert their own evidence
CREATE POLICY evidence_entries_insert ON evidence_entries
  FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Staff/Admin can update evidence
CREATE POLICY evidence_entries_update ON evidence_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Policy: Staff/Admin can view all packs
CREATE POLICY evidence_packs_select ON evidence_packs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Policy: Staff/Admin can manage packs
CREATE POLICY evidence_packs_manage ON evidence_packs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Comments
COMMENT ON TABLE evidence_entries IS 'Document intake ledger for Malta tax evidence with OCR tracking';
COMMENT ON TABLE evidence_packs IS 'Grouped evidence packs for VAT periods';
COMMENT ON COLUMN evidence_entries.file_hash IS 'SHA-256 hash for deduplication and integrity verification';
COMMENT ON COLUMN evidence_entries.ocr_confidence IS 'OCR extraction confidence score (0.0 to 1.0)';
