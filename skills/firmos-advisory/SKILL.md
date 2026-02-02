---
name: firmos-advisory
description: FirmOS advisory skill for James - CFO services, M&A, valuations, strategic consulting
metadata:
  {
    "openclaw": { "emoji": "💼", "requires": { "packages": ["@firmos/agents", "@firmos/programs"] } },
  }
---

# FirmOS Advisory Skill

Use this skill for **advisory and consulting** work. Agent **James** is the designated Advisory Lead.

## Capabilities

| Function | Description |
|----------|-------------|
| `adv:valuation` | Business valuation (DCF, multiples, NAV) |
| `adv:due-diligence` | M&A due diligence procedures |
| `adv:cfo-report` | CFO management reporting package |
| `adv:forecast` | Financial forecasting and budgeting |
| `adv:restructure` | Corporate restructuring advisory |

## Usage

```typescript
// Business valuation
firmos adv:valuation --method DCF --entity "TargetCo" --projection-years 5

// CFO reporting package
firmos adv:cfo-report --entity "ClientCo" --period Jan-2025 --metrics "Revenue,EBITDA,Cash"

// Due diligence
firmos adv:due-diligence --transaction "Acquisition of TargetCo" --scope "Financial,Tax,Legal"
```

## Services Catalog

### CFO-as-a-Service
- Monthly management reporting
- Cash flow forecasting
- KPI dashboards
- Board presentation materials

### M&A Advisory
- Buy-side due diligence
- Sell-side preparation
- Valuation opinions
- Deal structuring

### Strategic Consulting
- Business planning
- Market entry strategy
- Operational improvement
- Capital raising support

## Deliverables

All advisory work produces:
1. **Executive Summary** - Key findings and recommendations
2. **Detailed Report** - Full analysis with supporting data
3. **Presentation Deck** - Board-ready presentation materials
