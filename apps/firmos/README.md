# FirmOS — OpenClaw Multi-Agent Firm Operating System

> Big Four-level autonomous firm with 11 named agents, multi-jurisdiction packs (MT/RW), and policy-driven autonomy.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start API (development)
cd apps/api && pnpm dev

# Start Dashboard
cd apps/dashboard && pnpm dev
```

## Architecture

```
firmos/
├── apps/
│   ├── api/          # FirmOS REST API
│   └── dashboard/    # OpenClaw Dashboard
├── packages/
│   ├── agents/       # 11 Agent Manifests
│   ├── packs/        # Country Packs (MT, RW)
│   ├── programs/     # Global Programs
│   ├── tools/        # Tool Registry
│   ├── policies/     # Autonomy Rules
│   └── evidence/     # Guardian Checks
└── infra/supabase/   # Database Schema
```

## The 11 Agents

| Agent | Role | Domain |
|-------|------|--------|
| **Aline** | Firm Orchestrator | global |
| **Marco** | Autonomy & Policy Governor | global |
| **Diane** | Quality, Risk & Evidence Guardian | global |
| **Patrick** | Audit & Assurance Engine | global |
| **Sofia** | Accounting & Financial Reporting | global |
| **James** | Advisory & Consulting Engine | global |
| **Fatima** | Risk, Controls & Internal Audit | global |
| **Matthew** | Malta Tax Engine | malta |
| **Claire** | Malta CSP/MBR Engine | malta |
| **Emmanuel** | Rwanda Tax Engine | rwanda |
| **Chantal** | Rwanda Private Notary Engine | rwanda |

## Country Packs

- **Malta**: MT_TAX + MT_CSP
- **Rwanda**: RW_TAX + RW_PRIVATE_NOTARY

## Autonomy Model

- **Tier A (AUTO)**: Internal tasks — no operator needed
- **Tier B (AUTO+CHECK)**: Routine drafting — Guardian must pass
- **Tier C (ESCALATE)**: Novel/uncertain — operator review required

## Constraints

- One Operator (single human) for exceptions only
- No human role pyramid (no associate/senior/manager/partner)
- Country packs are strict: MT ≠ RW
- All outputs must be evidence-linked and versioned

## Agent Service Catalog

The Agent Service Catalog (`packages/programs/agent-service-catalog.ts`) maps each agent to:
- **Owned Services** — Services the agent is primary owner for
- **Supported Services** — Services the agent can assist
- **Allowed Packs** — Country packs the agent may use (`GLOBAL`, `MT_TAX`, `MT_CSP_MBR`, `RW_TAX`, `RW_PRIVATE_NOTARY`)
- **Outputs** — Artifacts the agent produces
- **External Actions** — Actions requiring policy/guardian gating

### Service Ownership

| Service | Owner Agent |
|---------|-------------|
| Audit & Assurance | Patrick |
| Accounting & Financial Reporting | Sofia |
| Advisory & Consulting | James |
| Risk, Controls & Internal Audit | Fatima |
| Malta Tax | Matthew |
| Malta CSP/MBR | Claire |
| Rwanda Tax | Emmanuel |
| Rwanda Private Notary | Chantal |

### Governance Agents

| Role | Agent |
|------|-------|
| Orchestrator | Aline |
| Policy Governor | Marco |
| Guardian | Diane |
