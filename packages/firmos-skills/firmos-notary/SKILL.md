---
name: firmos-notary
description: FirmOS notary skill for Chantal (Rwanda) - notarized documents, RDB filings, legal certifications
metadata:
  {
    "openclaw": { "emoji": "📜", "requires": { "packages": ["@firmos/agents", "@firmos/packs"] } },
  }
---

# FirmOS Notary Skill

Use this skill for **Rwanda notarial and registry** work. Agent **Chantal** is the designated Notary Lead.

## Capabilities

| Function | Description |
|----------|-------------|
| `notary:certify` | Notarize document |
| `notary:rdb-file` | File with Rwanda Development Board |
| `notary:company-reg` | Company registration support |
| `notary:amendment` | Articles amendment filing |
| `notary:certificate` | Certificate requests (good standing, etc.) |

## Usage

```typescript
// Notarize document
firmos notary:certify --document "Board Resolution" --client "ClientCo Ltd" --date 2025-02-01

// RDB filing
firmos notary:rdb-file --company "ClientCo Ltd" --filing-type "Annual Return" --fiscal-year 2024

// Good standing certificate
firmos notary:certificate --company "ClientCo Ltd" --type "Good Standing" --purpose "Banking"
```

## RDB Filings

| Filing | Purpose | Frequency |
|--------|---------|-----------|
| Annual Return | Company status update | Yearly |
| Director Changes | Board composition | As needed |
| Share Allotment | Capital changes | As needed |
| Address Change | Registered office | As needed |

## Notarized Documents

Common notarized documents include:
- Board resolutions
- Shareholder resolutions
- Power of attorney
- Certified copies of incorporation docs
- Affidavits and declarations

## Rwanda-Specific Requirements

- RDB online system integration
- Kinyarwanda/English bilingual support
- Local notary certification requirements
- RSSB employer registration

## Integration

Works with:
- `firmos-tax` for Rwanda tax compliance
- `firmos-accounting` for financial statements
- `firmos-governance` for corporate governance
