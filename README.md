# OpenClaw + FirmOS

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22+-green.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-10+-orange.svg)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org)

**OpenClaw** is an AI-powered personal assistant with a multi-agent operating system (**FirmOS**) for professional services automation.

## Quick Start

```bash
# Clone and install
git clone https://github.com/nicholaschuayunzhi/openclaw.git
cd openclaw && corepack enable && pnpm install

# Start gateway
pnpm gateway:watch
```

---

## Architecture

```
openclaw/
├── src/                      # Core platform (2200+ files)
│   ├── gateway/              # Local gateway server
│   ├── agents/               # Agent runtime
│   ├── cli/                  # Command line interface
│   └── channels/             # Channel adapters
├── channels/                 # 19 messaging channels
│   ├── discord/, telegram/, whatsapp/, slack/
│   ├── signal/, matrix/, msteams/, googlechat/
│   └── imessage/, line/, nostr/, voice-call/
├── packages/                 # Shared packages
│   ├── firmos-core/          # Core types + config loader
│   ├── firmos-agents/        # 11 agent definitions
│   ├── firmos-policies/      # Policy enforcement
│   ├── firmos-programs/      # QC gate + release runners
│   ├── firmos-packs/         # Malta/Rwanda jurisdiction packs
│   ├── firmos-tools/         # Agent tools + registry
│   ├── moltbot/              # Moltbot marketplace + AI chat
│   ├── prisma-cpa/           # Staff/Admin portal
│   ├── clawdbot/             # Clawdbot package
│   └── ui/                   # Shared UI components
├── apps/                     # Applications
│   ├── dashboard/            # Vite + React dashboard
│   ├── firmos/               # FirmOS control app
│   ├── api/                  # API server
│   ├── macos/                # Swift macOS app
│   ├── ios/                  # iOS app
│   └── android/              # Kotlin Android app
├── skills/                   # 60 skills modules
│   ├── firmos-*/             # 8 FirmOS skills (audit, tax, etc.)
│   └── ...                   # 52 base OpenClaw skills
├── extensions/               # 12 extension packages
├── supabase/                 # Database + edge functions
└── docs/                     # 300+ documentation files
```

---

## FirmOS Agent System

11 specialized AI agents with Big Four-grade personas:

### Governance Tier
| Agent | Role | Function |
|-------|------|----------|
| **Aline** | Orchestrator | Routes tasks, manages priorities |
| **Marco** | Governor | Policy enforcement, release control |
| **Diane** | Guardian | QC gates, ethics, risk validation |

### Global Engine
| Agent | Service | Skill |
|-------|---------|-------|
| **Patrick** | Audit Lead | `firmos-audit` |
| **Sofia** | Accounting | `firmos-accounting` |
| **James** | Advisory/CFO | `firmos-advisory` |
| **Fatima** | Risk & Controls | `firmos-risk` |

### Malta Engine (MT)
| Agent | Service | Skill |
|-------|---------|-------|
| **Matthew** | Tax Compliance | `firmos-tax` |
| **Claire** | CSP/MBR | `firmos-csp` |

### Rwanda Engine (RW)
| Agent | Service | Skill |
|-------|---------|-------|
| **Emmanuel** | Tax Compliance | `firmos-tax` |
| **Chantal** | Private Notary | `firmos-notary` |

### Autonomy Tiers

| Tier | Behavior |
|------|----------|
| **AUTO** | Agent completes autonomously |
| **AUTO+CHECK** | Guardian must PASS before release |
| **ESCALATE** | Requires operator attention |

---

## Messaging Channels (19)

| Category | Channels |
|----------|----------|
| **Enterprise** | Slack, MS Teams, Google Chat, Mattermost |
| **Consumer** | WhatsApp, Telegram, Discord, Line, Zalo |
| **Secure** | Signal, Matrix, Nostr |
| **Apple** | iMessage (BlueBubbles bridge) |
| **Other** | Twitch, Nextcloud Talk, Tlon, Voice Call |

---

## FirmOS Dashboard

The FirmOS dashboard (`apps/dashboard/`) extends the OpenClaw Control UI:

| Feature | Implementation |
|---------|---------------|
| **Auth** | Supabase Google OAuth (replaces device pairing) |
| **Config** | Dynamic gateway config from edge function |
| **Protocol** | `openclaw-control-ui` client, v3 |

```bash
# Local development
VITE_GATEWAY_URL=ws://localhost:19001
VITE_GATEWAY_TOKEN=dev-token
```

---

## Development


```bash
# Build
pnpm build

# Test
pnpm test

# Lint + Format
pnpm lint && pnpm format

# Type check
pnpm tsgo

# FirmOS tests
cd packages/firmos-programs && pnpm test
```

---

## Packages

| Package | Purpose |
|---------|---------|
| `@firmos/core` | Types, config loader |
| `@firmos/agents` | 11 agent definitions |
| `@firmos/policies` | Policy enforcement |
| `@firmos/programs` | Service programs, QC gates |
| `@firmos/packs` | Malta/Rwanda jurisdiction packs |
| `@firmos/tools` | Agent tool registry |
| `moltbot` | AI marketplace with claymorphism UI |
| `prisma-cpa` | Staff/Admin portal |

---

## Skills (60 total)

### FirmOS Skills (8)
- `firmos-audit` - Audit programs, evidence, QC gates
- `firmos-tax` - Tax compliance (MT/RW), filings
- `firmos-accounting` - Bookkeeping, close, reconciliation
- `firmos-advisory` - CFO services, M&A, valuations
- `firmos-risk` - ERM, controls, SOC, AML
- `firmos-governance` - Workflow, QC, ethics enforcement
- `firmos-csp` - Malta CSP/MBR, company secretarial
- `firmos-notary` - Rwanda notary, RDB filings

### Base OpenClaw Skills (52)
coding-agent, debugging, git, mcp, bash, and more...

---

## Supabase

```bash
# Local development
supabase start
supabase db push

# Studio: http://localhost:54323
```

### Key Tables
- `evidence_entries`, `evidence_packs` - Audit evidence ledger
- `vat_returns` - VAT return tracking
- `approvals` - Approval workflows
- `bank_reconciliation` - Bank reconciliation
- `aml_compliance` - AML/CFT compliance

---

## CI/CD

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Full test matrix (Node/Bun, Win/Mac/Linux) |
| `docker-release.yml` | Container builds |
| `formal-conformance.yml` | Protocol compliance |
| `install-smoke.yml` | Install verification |

---

## Contributing

1. Fork → Branch (`feat/my-feature`) → Make changes
2. Run `pnpm lint && pnpm test`
3. Commit: `feat(scope): description`
4. Open PR

---

## Security

- RLS policies on all Supabase tables
- JWT auth with 1-hour expiry
- `detect-secrets` in CI
- Staff/Admin RBAC enforced

Report issues: [security@openclaw.dev](mailto:security@openclaw.dev)

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for professional services automation**

[Documentation](docs/) • [Issues](https://github.com/nicholaschuayunzhi/openclaw/issues) • [Discussions](https://github.com/nicholaschuayunzhi/openclaw/discussions)

</div>
