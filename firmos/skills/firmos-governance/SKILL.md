---
name: firmos-governance
description: FirmOS governance skill for Aline (Orchestrator), Marco (Governor), Diane (Guardian) - workflow, QC, ethics
metadata:
  {
    "openclaw": { "emoji": "🏛️", "requires": { "packages": ["@firmos/agents", "@firmos/policies", "@firmos/programs"] } },
  }
---

# FirmOS Governance Skill

Use this skill for **workflow orchestration and governance**. Governance Tier Agents:
- **Aline** - Orchestrator (workflow routing, delegation)
- **Marco** - Governor (policy enforcement, QC gates)
- **Diane** - Guardian (ethics, independence, conflict checks)

## Capabilities

| Function | Description |
|----------|-------------|
| `gov:route` | Route engagement to appropriate agent(s) |
| `gov:delegate` | Delegate task between agents |
| `gov:qc-gate` | Execute QC gate check |
| `gov:ethics` | Run ethics and independence check |
| `gov:conflict` | Check for conflicts of interest |
| `gov:release` | Approve deliverable for release |

## Usage

```typescript
// Route new engagement
firmos gov:route --engagement "Tax Compliance Q1" --client "ClientCo" --services "Tax,Accounting"

// QC gate check
firmos gov:qc-gate --engagement-id ENG-2025-001 --gate "Partner Review" --reviewer "aline"

// Independence check
firmos gov:ethics --client "NewClient Ltd" --services "Audit" --check "Independence,Conflict"

// Release approval
firmos gov:release --engagement-id ENG-2025-001 --deliverable "Annual Report" --approver "aline"
```

## Governance Hierarchy

```
┌─────────────────────────────────────────┐
│           GOVERNANCE TIER               │
│  Aline (Orchestrator) ─ Marco ─ Diane   │
├─────────────────────────────────────────┤
│             GLOBAL TIER                 │
│   Patrick │ Sofia │ James │ Fatima      │
├─────────────────────────────────────────┤
│          JURISDICTIONAL TIER            │
│   MT: Matthew, Claire                   │
│   RW: Emmanuel, Chantal                 │
└─────────────────────────────────────────┘
```

## QC Gates

| Gate | Owner | Description |
|------|-------|-------------|
| Preparer | Agent | Self-review checklist |
| Reviewer | Peer | Independent peer review |
| Manager | Lead | Service line lead review |
| Partner | Aline | Final sign-off |

## Ethics Checks

Diane enforces:
- Client independence verification
- Conflict of interest screening
- Fee arrangement review
- Rotation requirements (audit)
- Gift/hospitality policies
