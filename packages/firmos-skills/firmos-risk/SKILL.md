---
name: firmos-risk
description: FirmOS risk skill for Fatima - enterprise risk, controls, compliance, SOC reporting
metadata:
  {
    "openclaw": { "emoji": "⚠️", "requires": { "packages": ["@firmos/agents", "@firmos/policies"] } },
  }
---

# FirmOS Risk Skill

Use this skill for **risk management and compliance** work. Agent **Fatima** is the designated Risk Lead.

## Capabilities

| Function | Description |
|----------|-------------|
| `risk:assess` | Enterprise risk assessment (COSO ERM) |
| `risk:control` | Control design and testing |
| `risk:compliance` | Regulatory compliance check |
| `risk:soc` | SOC 1/SOC 2 readiness assessment |
| `risk:aml` | AML/KYC risk evaluation |

## Usage

```typescript
// Risk assessment
firmos risk:assess --entity "ClientCo" --framework COSO --scope "Financial Reporting"

// Control testing
firmos risk:control --process "Revenue Recognition" --test-type "Design & Operating Effectiveness"

// SOC readiness
firmos risk:soc --type SOC2 --criteria "Security,Availability" --entity "ClientCo"
```

## Frameworks Supported

| Framework | Purpose |
|-----------|---------|
| COSO ERM | Enterprise risk management |
| COSO IC | Internal control framework |
| COBIT | IT governance and control |
| ISO 27001 | Information security |
| SOC 1/2 | Service organization controls |

## Risk Categories

1. **Strategic Risk** - Business model, competition, market
2. **Operational Risk** - Process failures, human error
3. **Financial Risk** - Market, credit, liquidity
4. **Compliance Risk** - Regulatory, legal, contractual
5. **Technology Risk** - Cyber, data, system failures

## Jurisdictional Compliance

### Malta (MT)
- MFSA regulatory requirements
- EU AML directives (AMLD6)
- GDPR compliance checks

### Rwanda (RW)
- BNR regulatory requirements
- RDB compliance
- Local AML/CFT regulations

## Reporting

Risk assessment outputs include:
- Risk register with ratings (Inherent/Residual)
- Control matrix with gap analysis
- Remediation roadmap with priorities
