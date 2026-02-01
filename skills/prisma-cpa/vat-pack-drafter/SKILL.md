---
name: vat-pack-drafter
description: Draft Malta VAT return packs with coded transactions, boxes, and CFR-compliant reporting. Use when preparing quarterly VAT returns (MT), coding income/expenses by VAT box, generating draft VAT pack documents, or reviewing VAT period calculations. Supports EC sales/purchases, reverse charge, and input tax adjustments.
---

# VAT Pack Drafter

Draft Malta VAT return packs for CFR submission (human submits).

## Workflow

1. **Identify Period** — Confirm VAT period (quarterly) and deadline
2. **Gather Evidence** — Pull coded transactions from evidence ledger
3. **Calculate Boxes** — Populate VAT boxes 1-15 per CFR rules
4. **Generate Draft Pack** — Create review document with line items
5. **Flag for Approval** — Enter maker-checker workflow
6. **Human Submits** — Track filed_proof after portal submission

## Box Mapping (MT-VAT)

| Box | Description |
|-----|-------------|
| 1 | Supplies at standard rate (19%) |
| 2 | Supplies at reduced rate (7%) |
| 3 | Zero-rated local supplies |
| 4 | Exempt supplies |
| 5 | EC supplies |
| 6 | Exports |
| 7-9 | Input tax calculations |
| 10-12 | EC acquisitions |
| 13-15 | Adjustments |

## Critical Constraints

> [!CAUTION]
> - **NEVER auto-submit** to CFR portal — human only
> - **NEVER estimate** missing data — flag for review
> - **NEVER override** maker-checker approvals
> - All outputs are DRAFT until approved

## Usage

```text
User: "Prepare Q4 2025 VAT pack for client ABC"

1. Query evidence_items WHERE period = 'Q4-2025' AND client_id = 'ABC'
2. Group by vat_code and calculate per-box totals
3. Generate draft pack with line-by-line source refs
4. Insert into vat_periods with status = 'draft'
5. Create approval_requests for maker-checker
```

## References

- See [domain-types.md](../references/domain-types.md) for type definitions
- CFR deadlines: 15th of month following period end
