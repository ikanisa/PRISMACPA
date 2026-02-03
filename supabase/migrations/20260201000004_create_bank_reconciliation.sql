-- Migration: Bank Reconciliation Schema
-- Purpose: Bank transaction import, matching, and exception handling

-- Enum for bank transaction status
CREATE TYPE bank_transaction_status AS ENUM (
  'unmatched',    -- Awaiting match
  'matched',      -- Matched to evidence
  'confirmed',    -- Match confirmed
  'exception'     -- Requires manual review
);

-- Enum for match type
CREATE TYPE bank_match_type AS ENUM (
  'auto_exact',       -- Automatic exact match
  'auto_fuzzy',       -- Automatic fuzzy match
  'manual',           -- Manual match
  'split',            -- Split transaction
  'bulk'              -- Bulk reconciliation
);

-- Bank accounts
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account details
  account_name TEXT NOT NULL,
  account_number TEXT,  -- Masked
  iban TEXT,
  bic TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  
  -- Bank info
  bank_name TEXT,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank transactions (imported from statements)
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Account reference
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL,
  reference TEXT,
  
  -- Amounts
  amount NUMERIC(15, 2) NOT NULL,
  balance_after NUMERIC(15, 2),
  
  -- Import tracking
  import_batch_id UUID,
  statement_line_number INTEGER,
  raw_data JSONB,
  
  -- Status
  status bank_transaction_status NOT NULL DEFAULT 'unmatched',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank matches (transaction to evidence mapping)
CREATE TABLE bank_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  evidence_entry_id UUID REFERENCES evidence_entries(id) ON DELETE SET NULL,
  
  -- Match details
  match_type bank_match_type NOT NULL,
  confidence_score NUMERIC(5, 4),  -- 0.0000 to 1.0000 for auto matches
  match_notes TEXT,
  
  -- Split handling
  matched_amount NUMERIC(15, 2),  -- For split transactions
  
  -- Confirmation
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bank reconciliation summaries (per period)
CREATE TABLE bank_reconciliation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period
  vat_period_id UUID REFERENCES vat_periods(id),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  
  -- Reconciliation date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Opening and closing
  opening_balance NUMERIC(15, 2),
  closing_balance NUMERIC(15, 2),
  
  -- Counts
  total_transactions INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  exception_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_status ON bank_transactions(status);
CREATE INDEX idx_bank_matches_transaction ON bank_matches(bank_transaction_id);
CREATE INDEX idx_bank_matches_evidence ON bank_matches(evidence_entry_id);
CREATE INDEX idx_bank_recon_summary_period ON bank_reconciliation_summaries(vat_period_id);

-- Updated_at triggers
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_matches_updated_at
  BEFORE UPDATE ON bank_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_recon_summaries_updated_at
  BEFORE UPDATE ON bank_reconciliation_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliation_summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Staff/Admin can view/manage bank data
CREATE POLICY bank_accounts_manage ON bank_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

CREATE POLICY bank_transactions_manage ON bank_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

CREATE POLICY bank_matches_manage ON bank_matches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

CREATE POLICY bank_recon_summaries_manage ON bank_reconciliation_summaries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' IN ('admin', 'staff')
    )
  );

-- Comments
COMMENT ON TABLE bank_accounts IS 'Bank account configuration for reconciliation';
COMMENT ON TABLE bank_transactions IS 'Imported bank statement transactions';
COMMENT ON TABLE bank_matches IS 'Transaction to evidence matching records';
COMMENT ON TABLE bank_reconciliation_summaries IS 'Period-level reconciliation status';
