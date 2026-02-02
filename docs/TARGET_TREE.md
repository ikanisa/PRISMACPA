# OpenClaw-FirmOS Target Directory Structure

> This document defines the canonical directory layout for the OpenClaw-FirmOS monorepo.
> All new code should follow this structure. Existing code will be gradually migrated.

---

## Target Structure

```
openclaw/
├── apps/                        # Native client applications
│   ├── android/                 # Android app (Kotlin)
│   ├── ios/                     # iOS app (Swift)
│   ├── macos/                   # macOS app (Swift)
│   └── shared/                  # Shared native code (OpenClawKit)
│
├── firmos/                      # FirmOS Multi-Agent Operating System
│   ├── apps/                    # FirmOS web applications
│   │   ├── api/                 # REST API server
│   │   └── dashboard/           # React dashboard
│   │
│   ├── catalogs/                # YAML catalogs (source of truth)
│   │   ├── agents_catalog.yaml
│   │   ├── service_catalog.yaml
│   │   ├── skills_matrix.yaml
│   │   ├── resource_library.yaml
│   │   └── template_catalog.yaml
│   │
│   ├── modules/                 # Runtime modules (NEW)
│   │   ├── audit_log/           # Audit trail management
│   │   ├── case_mgmt/           # Case/engagement management
│   │   ├── routing/             # Agent routing/dispatch
│   │   ├── evidence/            # Evidence collection/linking
│   │   ├── qc_gates/            # Diane QC gate runner
│   │   ├── release_gates/       # Marco release workflow
│   │   └── template_factory/    # Template management
│   │
│   ├── packages/                # FirmOS core packages
│   │   ├── agents/              # 11 Agent manifests
│   │   ├── core/                # Core types and utilities
│   │   ├── evidence/            # Evidence types
│   │   ├── packs/               # Country packs (MT, RW)
│   │   ├── policies/            # Autonomy policies
│   │   ├── programs/            # Service programs
│   │   └── tools/               # Tool registry
│   │
│   ├── schemas/                 # Validation schemas (NEW)
│   │   ├── agents_catalog.schema.json
│   │   ├── service_catalog.schema.json
│   │   └── validation.ts
│   │
│   ├── tests/                   # FirmOS test suite
│   └── infra/                   # Infrastructure configs
│
├── src/                         # Core OpenClaw runtime
│   ├── agents/                  # Agent runtime engine
│   ├── gateway/                 # Gateway server
│   ├── channels/                # Channel adapters
│   └── ...                      # (50+ domains)
│
├── ui/                          # Main web UI (Vite/React)
├── packages/                    # Workspace packages
├── extensions/                  # Extensions
├── docs/                        # Documentation
├── scripts/                     # Build/dev scripts
└── test/                        # E2E tests
```

---

## Ownership Rules

| Directory | Owner | Notes |
|-----------|-------|-------|
| `firmos/apps/` | FirmOS Team | Dashboard + API |
| `firmos/catalogs/` | FirmOS Team | YAML source of truth |
| `firmos/modules/` | FirmOS Team | Runtime modules |
| `firmos/packages/` | FirmOS Team | Core packages |
| `firmos/schemas/` | FirmOS Team | Validation schemas |
| `src/` | Core Team | OpenClaw runtime |
| `apps/` | Native Team | iOS/Android/macOS |
| `ui/` | UI Team | Web interface |

---

## Boundaries (What Belongs Where)

### ✅ MUST go in `firmos/`
- Agent definitions and manifests
- Country pack configurations
- Service program definitions
- Autonomy policies
- QC/Release gate logic
- Template factory
- FirmOS-specific dashboards/APIs

### ✅ MUST stay in `src/`
- Gateway server
- Channel adapters (Telegram, Discord, etc.)
- Core agent runtime
- Plugin system
- Memory/vector store

### ❌ MUST NOT mix
- FirmOS agent configs → NOT in `src/`
- Gateway networking → NOT in `firmos/`
- Country-specific logic → NOT in global packages

---

## Import Paths

Use these path aliases for clean imports:

```typescript
// FirmOS packages
import { AgentId } from '@firmos/core';
import { ServiceProgram } from '@firmos/programs';
import { AutonomyTier } from '@firmos/policies';

// FirmOS modules (NEW)
import { runQCGate } from '@firmos/modules/qc_gates';
import { submitForRelease } from '@firmos/modules/release_gates';

// Core OpenClaw
import { GatewayServer } from '@openclaw/gateway';
```

---

## Migration Status

| Component | Status | Notes |
|-----------|--------|-------|
| `firmos/apps/` | ✅ Complete | API + Dashboard exist |
| `firmos/catalogs/` | ✅ Complete | 5 YAML files |
| `firmos/packages/` | ✅ Complete | All packages exist |
| `firmos/modules/` | 🔲 Planned | To be created |
| `firmos/schemas/` | 🔲 Planned | To be created |
| Path aliases | 🔲 Planned | tsconfig update needed |
