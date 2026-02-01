---
name: bank-matcher
description: Match bank transactions to evidence items for reconciliation with auto-match suggestions and exception handling. Use when importing bank statements, matching transactions to invoices/receipts, resolving unmatched items, or generating reconciliation reports for Malta accounting.
---

# Bank Matcher

Match bank transactions to evidence items for reconciliation.

## Workflow

1. **Import Statement** — Parse bank statement (CSV/OFX/PDF)
2. **Normalize Data** — Standardize dates, amounts, descriptions
3. **Auto-Match** — Apply matching rules to find candidates
4. **Score Matches** — Rank by confidence (amount, date, desc)
5. **Queue Exceptions** — Unmatched items for manual review
6. **Finalize** — Confirm matches and update reconciliation

## Matching Rules

| Rule | Confidence Boost | Description |
|------|------------------|-------------|
| Exact amount | +40% | Transaction amount matches exactly |
| ±3 days | +25% | Date within 3-day window |
| Vendor match | +20% | Description contains vendor name |
| Reference match | +35% | Invoice/PO number in narrative |

**Match Thresholds:**
- **≥85%**: Auto-link (with audit trail)
- **60-84%**: Suggest for review
- **<60%**: Manual matching required

## Transaction Statuses

| Status | Description |
|--------|-------------|
| `pending` | Imported, not yet matched |
| `matched_auto` | Auto-matched (high confidence) |
| `matched_manual` | Manually matched |
| `exception` | Unmatched, needs review |
| `excluded` | Out of scope (e.g., transfers) |

## Critical Constraints

> [!CAUTION]
> - **NEVER delete** bank transactions
> - **Log all matches** with confidence scores
> - **Preserve** original statement reference
> - Exceptions must be **reviewed, not hidden**

## Usage

```text
User: "Import January bank statement for account 12345"

1. Parse statement file
2. Insert into bank_transactions with account_id, status='pending'
3. For each transaction:
   a. Query evidence_items by amount ±0.01
   b. Filter by date range (±3 days)
   c. Score matches using rules
   d. If score ≥85%: set matched_evidence_id, status='matched_auto'
   e. Else: status='pending' for review
4. Generate summary: X matched, Y pending, Z exceptions
```

## Reconciliation Reports

```sql
-- Reconciliation summary query
SELECT 
  account_name,
  COUNT(*) FILTER (WHERE status = 'matched_auto') as auto_matched,
  COUNT(*) FILTER (WHERE status = 'matched_manual') as manual_matched,
  COUNT(*) FILTER (WHERE status = 'exception') as exceptions,
  SUM(amount) FILTER (WHERE status IN ('matched_auto', 'matched_manual')) as reconciled_amount
FROM bank_transactions bt
JOIN bank_accounts ba ON bt.account_id = ba.id
WHERE bt.transaction_date BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY account_name;
```

## References

- See [domain-types.md](../references/domain-types.md) for Bank types
