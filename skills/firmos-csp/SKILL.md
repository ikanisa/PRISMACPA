---
name: firmos-csp
description: FirmOS CSP/MBR skill for Claire (Malta) - Company Service Provider, Malta Business Registry filings
metadata:
  {
    "openclaw": { "emoji": "🏢", "requires": { "packages": ["@firmos/agents", "@firmos/packs"] } },
  }
---

# FirmOS CSP/MBR Skill

Use this skill for **Malta company secretarial and registry** work. Agent **Claire** is the designated CSP Lead.

## Capabilities

| Function | Description |
|----------|-------------|
| `csp:incorporate` | Company incorporation preparation |
| `csp:annual-return` | Annual return filing (MBR) |
| `csp:director` | Director appointment/resignation |
| `csp:shareholder` | Share transfer/allotment |
| `csp:registered-office` | Registered office services |
| `csp:ubo` | Ultimate Beneficial Owner registration |

## Usage

```typescript
// Annual return
firmos csp:annual-return --company "ClientCo Ltd" --mbr-number C12345 --financial-year 2024

// Director change
firmos csp:director --company "ClientCo Ltd" --action "Appoint" --name "John Smith" --date 2025-02-01

// UBO registration
firmos csp:ubo --company "ClientCo Ltd" --update "New UBO" --effective-date 2025-01-15
```

## Malta Business Registry (MBR) Filings

| Form | Purpose | Deadline |
|------|---------|----------|
| Annual Return | Yearly filing | Within 42 days of AGM |
| Form C | Change of directors | 14 days |
| Form K | Share transfers | 14 days |
| UBO Forms | Beneficial ownership | 14 days |

## CSP License Requirements

- Claire operates under MFSA CSP license requirements
- All filings include anti-money laundering checks
- Client due diligence maintained per 4th/5th AMLD

## Integration

Works with:
- `firmos-tax` for Malta tax compliance
- `firmos-accounting` for statutory accounts
- `firmos-governance` for board resolutions
