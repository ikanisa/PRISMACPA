---
name: firmos-tax
description: FirmOS tax skill for Matthew (Malta Tax) and Emmanuel (Rwanda Tax) - compliance, planning, filings
metadata:
  {
    "openclaw": { "emoji": "📊", "requires": { "packages": ["@firmos/agents", "@firmos/packs"] } },
  }
---

# FirmOS Tax Skill

Use this skill for **tax compliance and advisory** work. Agents:
- **Matthew** - Malta Tax (MT jurisdiction)
- **Emmanuel** - Rwanda Tax (RW jurisdiction)

## Capabilities

| Function | Description |
|----------|-------------|
| `tax:compute` | Calculate tax liability with applicable rates/exemptions |
| `tax:filing` | Prepare tax return filings |
| `tax:deadline` | Check compliance deadlines |
| `tax:advisory` | Provide tax planning advice |
| `tax:withholding` | Calculate WHT on cross-border transactions |

## Malta (MT) Functions

```typescript
// VAT computation
firmos tax:compute --jurisdiction MT --type VAT --period Q1-2025 --client "ClientCo Ltd"

// Corporate income tax
firmos tax:compute --jurisdiction MT --type CIT --fiscal-year 2024

// Check filing deadlines
firmos tax:deadline --jurisdiction MT --type VAT
```

### Malta-Specific Rules
- Standard VAT rate: 18%
- Corporate tax rate: 35% (with refund system)
- Participation exemption on dividends
- MFSA regulatory compliance required

## Rwanda (RW) Functions

```typescript
// Corporate income tax
firmos tax:compute --jurisdiction RW --type CIT --fiscal-year 2024

// VAT computation
firmos tax:compute --jurisdiction RW --type VAT --period Jan-2025

// Withholding tax on services
firmos tax:withholding --jurisdiction RW --payment-type "Technical Services" --amount 5000000
```

### Rwanda-Specific Rules
- Standard VAT rate: 18%
- Corporate tax rate: 30%
- Withholding tax: 15% (dividends/interest), 15% (royalties)
- RRA electronic filing mandatory
- RSSB contributions applicable

## Cross-Border Considerations

- Double Tax Treaty analysis
- Transfer pricing documentation
- PE (Permanent Establishment) risk assessment
