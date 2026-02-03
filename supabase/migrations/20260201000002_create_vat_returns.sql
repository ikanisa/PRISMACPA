-- Migration: VAT Returns Schema
-- Purpose: Malta VAT return periods, line items, and filing status

-- Enum for VAT period status
CREATE TYPE vat_period_status AS ENUM (
  'open',       -- Active period, accepting entries
  'draft',      -- Return drafted, awaiting review
  'reviewed',   -- Reviewed, awaiting filing
  'filed',      -- Submitted to CFR
  'paid'        -- Tax paid
);

-- VAT periods table (quarterly/monthly Malta VAT)
CREATE TABLE vat_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period definition
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  deadline DATE NOT NULL,
  
  -- Status
  status vat_period_status NOT NULL DEFAULT 'open',
  
  -- Summary amounts (EUR)
  output_vat NUMERIC(15, 2) DEFAULT 0,      -- VAT on sales
  input_vat NUMERIC(15, 2) DEFAULT 0,       -- VAT on purchases
  vat_due NUMERIC(15, 2) DEFAULT 0,         -- Net payable/refundable
  
  -- Filing info
  cfr_reference TEXT,           -- CFR submission reference
  filed_at TIMESTAMPTZ,
  filed_by UUID,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT valid_deadline CHECK (deadline >= period_end)
);

-- VAT line items (detailed breakdown)
CREATE TABLE vat_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period association
  vat_period_id UUID NOT NULL REFERENCES vat_periods(id) ON DELETE CASCADE,
  
  -- CFR box mapping
  cfr_box TEXT NOT NULL,  -- 'box1', 'box2', etc.
  cfr_box_description TEXT,
  
  -- Amounts
  taxable_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5, 2),  -- 18%, 7%, 5%, 0%
  
  -- Classification
  transaction_type TEXT,  -- 'sales', 'purchases', 'exempt', 'reverse_charge'
  
  -- Evidence link
  evidence_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VAT return drafts (JSON snapshots before filing)
CREATE TABLE vat_return_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  vat_period_id UUID NOT NULL REFERENCES vat_periods(id) ON DELETE CASCADE,
  
  -- Draft data
  version INTEGER NOT NULL DEFAULT 1,
  draft_data JSONB NOT NULL,
  
  -- Author
  created_by UUID NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vat_periods_status ON vat_periods(status);
CREATE INDEX idx_vat_periods_dates ON vat_periods(period_start, period_end);
CREATE INDEX idx_vat_line_items_period ON vat_line_items(vat_period_id);
CREATE INDEX idx_vat_line_items_box ON vat_line_items(cfr_box);
CREATE INDEX idx_vat_return_drafts_period ON vat_return_drafts(vat_period_id);

-- Foreign key from evidence_entries to vat_periods
ALTER TABLE evidence_entries
  ADD CONSTRAINT fk_evidence_vat_period
  FOREIGN KEY (vat_period_id) REFERENCES vat_periods(id);

-- Foreign key from evidence_packs to vat_periods
ALTER TABLE evidence_packs
  ADD CONSTRAINT fk_evidence_packs_vat_period
  FOREIGN KEY (vat_period_id) REFERENCES vat_periods(id);

-- Updated_at triggers
CREATE TRIGGER update_vat_periods_updated_at
  BEFORE UPDATE ON vat_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vat_line_items_updated_at
  BEFORE UPDATE ON vat_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE vat_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_return_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Staff/Admin can view VAT periods
CREATE POLICY vat_periods_select ON vat_periods
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Policy: Staff can update, Admin can manage
CREATE POLICY vat_periods_update ON vat_periods
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Policy: Admin can insert/delete
CREATE POLICY vat_periods_admin ON vat_periods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Line items follow period access
CREATE POLICY vat_line_items_select ON vat_line_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vat_periods p
      WHERE p.id = vat_period_id
    )
  );

CREATE POLICY vat_line_items_manage ON vat_line_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Drafts: creator and staff/admin can view
CREATE POLICY vat_return_drafts_select ON vat_return_drafts
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

CREATE POLICY vat_return_drafts_insert ON vat_return_drafts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Comments
COMMENT ON TABLE vat_periods IS 'Malta VAT return periods with status tracking';
COMMENT ON TABLE vat_line_items IS 'Detailed VAT line items mapped to CFR boxes';
COMMENT ON TABLE vat_return_drafts IS 'JSON snapshots of VAT returns before filing';
COMMENT ON COLUMN vat_periods.cfr_reference IS 'Commissioner for Revenue submission reference number';
