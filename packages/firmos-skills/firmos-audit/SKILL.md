---
name: firmos-audit
description: FirmOS audit skill for Patrick (Audit Lead) - external & internal audit, evidence collection, QC gates
metadata:
  {
    "openclaw": { "emoji": "🔍", "requires": { "packages": ["@firmos/agents", "@firmos/policies", "@firmos/programs"] } },
  }
---

# FirmOS Audit Skill

Use this skill for all **external and internal audit** work. Agent **Patrick** is the designated Audit Lead.

## Capabilities

| Function | Description |
|----------|-------------|
| `audit:plan` | Generate audit program from engagement scope |
| `audit:evidence` | Collect and validate evidence artifacts |
| `audit:sample` | Statistical sampling with ISA/ISAE justification |
| `audit:finding` | Document findings with COSO/COBIT references |
| `audit:qc` | Run QC gate before sign-off |
| `audit:report` | Generate audit report draft |

## Usage

```typescript
// Request audit planning
firmos audit:plan --engagement "Annual Financial Statement Audit FY2025" --client "ClientCo Ltd"

// Collect evidence
firmos audit:evidence --assertion "Existence" --account "Receivables" --sample-size 25

// Run QC gate
firmos audit:qc --engagement-id ENG-2025-001 --gate "Manager Review"
```

## Jurisdictional Notes

- **Malta (MT):** Apply MFSA regulatory overlay, EU audit directives
- **Rwanda (RW):** Apply RRA requirements, local GAAP considerations

## QC Gates

All audit work requires passing QC gates before release:

1. **Preparer Check** - Self-review by performing agent
2. **Reviewer Check** - Peer review by another agent
3. **Manager Review** - Patrick approval
4. **Partner Sign-off** - Aline (Orchestrator) final approval

## Evidence Standards

- All evidence must be dated, sourced, and digitally signed
- Chain of custody maintained in audit trail
- Cross-reference working papers with assertions tested
