# Prisma CPA + FirmOS

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22+-green.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-10+-orange.svg)](https://pnpm.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E.svg)](https://supabase.com)

**Prisma CPA** is an AI-powered multi-agent operating system (**FirmOS**) for professional services automation — audit, tax, accounting, advisory, and compliance.

> Originally forked from [OpenClaw](https://github.com/openclaw/openclaw). Specialized for Malta and Rwanda jurisdictions with Big Four-grade AI agents.

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/ikanisa/PRISMACPA.git
cd PRISMACPA && corepack enable && pnpm install

# Start gateway
pnpm gateway:watch

# Start UI (separate terminal)
cd ui && pnpm dev
```

**Supabase (local):**
```bash
supabase start
supabase db push
# Studio: http://localhost:54323
```

---

## Architecture Overview

```
PRISMACPA/
├── src/                      # Core platform (2500+ files)
│   ├── gateway/              # Local gateway server
│   ├── agents/               # Agent runtime
│   ├── cli/                  # Command line interface
│   └── channels/             # Channel adapters
├── packages/                 # 8 shared packages
│   ├── firmos-core/          # Core types + config loader
│   ├── firmos-agents/        # 11 agent definitions
│   ├── firmos-policies/      # Policy enforcement
│   ├── firmos-programs/      # QC gate + release runners
│   ├── firmos-packs/         # Malta/Rwanda jurisdiction packs
│   ├── firmos-tools/         # Agent tools + registry
│   ├── moltbot-official/     # Moltbot marketplace + AI chat
│   └── clawdbot/             # Clawdbot package
├── apps/                     # 7 applications
│   ├── dashboard/            # Vite + React dashboard
│   ├── firmos/               # FirmOS control app
│   ├── api/                  # API server
│   ├── shared/               # Shared app utilities
│   ├── macos/                # Swift macOS app
│   ├── ios/                  # iOS app
│   └── android/              # Kotlin Android app
├── channels/                 # 19 messaging channels
├── skills/                   # 63 skills modules
│   ├── firmos-*/             # 11 FirmOS skills
│   └── ...                   # 52 base OpenClaw skills
├── extensions/               # 30 extension packages
├── supabase/                 # Database + edge functions
│   ├── migrations/           # 8 database migrations
│   └── functions/            # Edge functions (OCR, webhooks)
├── ui/                       # Control UI (Lit + TypeScript)
├── modules/                  # Business logic modules
├── docs/                     # 300+ documentation files
└── firmos/                   # FirmOS configuration
```

---

## FirmOS Agent System

**11 specialized AI agents** with Big Four-grade personas:

### Governance Tier

| Agent | Role | Function |
|-------|------|----------|
| **Aline** | Orchestrator | Routes tasks, manages priorities, agent coordination |
| **Marco** | Governor | Policy enforcement, release control, compliance gates |
| **Diane** | Guardian | QC gates, ethics, risk validation, approval workflows |

### Global Engine

| Agent | Service | Skill |
|-------|---------|-------|
| **Patrick** | Audit Lead | `firmos-audit` |
| **Sofia** | Accounting | `firmos-accounting` |
| **James** | Advisory/CFO | `firmos-advisory` |
| **Fatima** | Risk & Controls | `firmos-risk` |
| **Yves** | Fullstack Dev | `firmos-fullstack` |

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

## Skills (63 total)

### FirmOS Skills (11)

| Skill | Function |
|-------|----------|
| `firmos-audit` | Audit programs, evidence, QC gates |
| `firmos-tax` | Tax compliance (MT/RW), filings |
| `firmos-accounting` | Bookkeeping, close, reconciliation |
| `firmos-advisory` | CFO services, M&A, valuations |
| `firmos-risk` | ERM, controls, SOC, AML |
| `firmos-governance` | Workflow, QC, ethics enforcement |
| `firmos-csp` | Malta CSP/MBR, company secretarial |
| `firmos-notary` | Rwanda notary, RDB filings |
| `firmos-orchestrator` | Agent routing, task distribution |
| `firmos-fullstack` | System maintenance, UI/UX, development |

### Base OpenClaw Skills (52)

`coding-agent`, `debugging`, `git`, `github`, `mcp`, `bash`, `slack`, `discord`, `gemini`, `notion`, `obsidian`, `trello`, `weather`, `voice-call`, and more...

---

## Packages (8)

| Package | Purpose |
|---------|---------|
| `@firmos/core` | Types, config loader, constants |
| `@firmos/agents` | 11 agent definitions + personas |
| `@firmos/policies` | Policy enforcement, autonomy tiers |
| `@firmos/programs` | Service programs, QC gates |
| `@firmos/packs` | Malta/Rwanda jurisdiction packs |
| `@firmos/tools` | Agent tool registry |
| `moltbot-official` | AI marketplace with claymorphism UI |
| `clawdbot` | Clawdbot integration package |

---

## Extensions (30)

Authentication, diagnostics, memory, and channel extensions:

- **Auth:** `google-antigravity-auth`, `google-gemini-cli-auth`, `qwen-portal-auth`, `minimax-portal-auth`
- **Memory:** `memory-core`, `memory-lancedb`
- **Diagnostics:** `diagnostics-otel`, `copilot-proxy`
- **Channels:** `telegram`, `discord`, `slack`, `whatsapp`, `signal`, `matrix`, `msteams`, `googlechat`, `line`, `zalo`, `zalouser`, `nostr`, `tlon`, `twitch`, `voice-call`, `nextcloud-talk`, `mattermost`, `imessage`, `bluebubbles`
- **Other:** `open-prose`, `lobster`, `llm-task`

---

## Supabase Database

### Migrations (8)

| Migration | Purpose |
|-----------|---------|
| `create_evidence_ledger` | Audit evidence entries and packs |
| `create_vat_returns` | VAT return tracking |
| `create_approvals` | Approval workflows |
| `create_bank_reconciliation` | Bank reconciliation |
| `create_aml_compliance` | AML/CFT compliance |
| `create_firmos_core_tables` | Core FirmOS entities |
| `add_firmos_entities_workstreams` | Workstreams, clients, engagements |
| `reload_schema` | Schema refresh |

### Edge Functions

- `ocr-processor` — Document OCR processing
- `webhook-handler` — External webhook handling

### Key Tables

- `evidence_entries`, `evidence_packs` — Audit evidence ledger
- `vat_returns` — VAT return tracking
- `approvals` — Approval workflows
- `bank_reconciliation` — Bank reconciliation
- `aml_compliance` — AML/CFT compliance
- `clients`, `engagements`, `workstreams` — FirmOS core entities

---

## Development

### Commands

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

# UI development
cd ui && pnpm dev
```

### Testing

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests (Vitest) |
| `pnpm test:coverage` | Tests with V8 coverage |
| `pnpm test:live` | Live tests with real keys |
| `pnpm test:docker` | Docker-based tests |

---

## Local Development Setup

> **⚠️ Gateway Auth is SIMPLIFIED for local development**

For local development, gateway authentication uses a **shared dev token** and device pairing is disabled.

**Gateway config (`~/.openclaw/openclaw.json`):**
```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true
    },
    "auth": {
      "mode": "token",
      "token": "dev-local-token"
    }
  }
}
```

**Environment variables (`ui/.env.local`):**
```bash
VITE_GATEWAY_URL=ws://127.0.0.1:18789
```

**For production**, you MUST:
1. Set `allowInsecureAuth: false`
2. Set `dangerouslyDisableDeviceAuth: false`
3. Generate a secure random token: `openssl rand -hex 32`
4. Store the token securely and provide it to authorized clients

---

## CI/CD

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Full test matrix (Node/Bun, Win/Mac/Linux) |
| `docker-release.yml` | Container builds |
| `formal-conformance.yml` | Protocol compliance |
| `install-smoke.yml` | Install verification |

### Deployment Options

- **Cloudflare Pages:** `ui/` static build + Wrangler deploy
- **Fly.io:** `fly.toml`
- **Render:** `render.yaml`
- **Docker Compose:** `docker-compose.yml`

---

## Security

- **RLS policies** on all Supabase tables
- **JWT auth** with 1-hour expiry
- **`detect-secrets`** in CI pipeline
- **Staff/Admin RBAC** enforced at UI, API, and DB layers

Report issues: [security@openclaw.dev](mailto:security@openclaw.dev)

---

## Contributing

1. Fork → Branch (`feat/my-feature`) → Make changes
2. Run `pnpm lint && pnpm test`
3. Commit: `feat(scope): description`
4. Open PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for professional services automation**

[Documentation](docs/) • [Issues](https://github.com/ikanisa/PRISMACPA/issues) • [Discussions](https://github.com/ikanisa/PRISMACPA/discussions)

</div>
