---
description: Malta-only compliance rules for tax assistant.
---

# Malta Compliance Rules

## Scope Constraints

- **Geography**: Malta only (country code: MT)
- **VAT Regime**: Malta VAT Act (Chapter 406)
- **Tax Authority**: Commissioner for Revenue (CFR)
- **Portal**: CFR e-Services (requires e-ID or delegated access)

## Human Portal Submission

The agent **NEVER** interacts with CFR portals. Human must:
1. Log in with e-ID or delegated credentials
2. Enter figures from approved VAT Draft Pack
3. Submit and capture confirmation
4. Upload proof (screenshot/PDF) to evidence vault

## Status Rules

| Status | Meaning |
|--------|---------|
| `intake` | Documents being collected |
| `coding` | Transactions being classified |
| `reconciliation` | Bank matching in progress |
| `draft` | VAT pack draft ready for review |
| `approved` | Maker-checker complete |
| `filed` | Human confirmed submission |

Never auto-transition to "Filed" status.
