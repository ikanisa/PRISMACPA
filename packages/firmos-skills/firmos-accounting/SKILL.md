---
name: firmos-accounting
description: FirmOS accounting skill for Sofia - bookkeeping, close, reconciliation, financial reporting
metadata:
  {
    "openclaw": { "emoji": "📒", "requires": { "packages": ["@firmos/agents", "@firmos/programs"] } },
  }
---

# FirmOS Accounting Skill

Use this skill for **accounting and financial close** work. Agent **Sofia** is the designated Accounting Lead.

## Capabilities

| Function | Description |
|----------|-------------|
| `acc:journal` | Post journal entries with supporting docs |
| `acc:reconcile` | Perform account reconciliation |
| `acc:close` | Execute period-end close procedure |
| `acc:report` | Generate financial statements |
| `acc:interco` | Process intercompany transactions |
| `acc:fx` | Handle foreign exchange translations |

## Usage

```typescript
// Post journal entry
firmos acc:journal --date 2025-01-31 --debit "4100:Revenue" --credit "1100:Cash" --amount 50000 --currency RWF

// Reconcile bank account
firmos acc:reconcile --account "1000:Bank-BK" --period Jan-2025 --statement-balance 12500000

// Monthly close
firmos acc:close --period Jan-2025 --entity "ClientCo Ltd" --jurisdiction RW
```

## Close Procedures

1. **Pre-Close** - Cutoff verification, accruals review
2. **Transaction Processing** - Journal entries, adjustments
3. **Reconciliation** - Bank, intercompany, subledger
4. **Reporting** - Trial balance, financial statements
5. **Review** - Manager review, partner sign-off

## Reporting Standards

- **Malta:** IFRS for SMEs or Full IFRS
- **Rwanda:** IFRS for SMEs (RDB requirement)

## Integration

Works with:
- `firmos-audit` for audit trail and evidence
- `firmos-tax` for tax-adjusted financials
- `firmos-advisory` for management reporting
