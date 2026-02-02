# FirmOS Developer Onboarding

> Quick start for new contributors

---

## Prerequisites

- **Node.js 22+** and **pnpm 10+**
- **Git** with submodule support
- Editor with TypeScript support (VS Code recommended)

---

## Getting Started

```bash
# Clone and install
git clone --recurse-submodules https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install

# Start development
pnpm gateway:dev    # Gateway server
pnpm ui:dev         # Control UI (separate terminal)
```

---

## Repository Structure

| Path | Purpose |
|------|---------|
| `src/` | Core OpenClaw runtime (~2500 files) |
| `packages/firmos-*` | FirmOS core packages (types, agents, policies) |
| `modules/` | Business logic modules (routing, gates, templates) |
| `firmos/` | YAML configs (catalogs + policies) |
| `apps/` | Applications (dashboard, api, native apps) |
| `ui/` | Lit-based Control UI |

See [architecture.md](./architecture.md) for full details.

---

## Key Concepts

### Agent System

FirmOS has 11 specialized agents in 3 tiers:

1. **Governance**: Aline (orchestrator), Marco (governor), Diane (guardian)
2. **Global**: Patrick (audit), Sofia (accounting), James (advisory), Fatima (risk)
3. **Jurisdiction**: Matthew/Claire (Malta), Emmanuel/Chantal (Rwanda)

### Gate System

All work flows through two gates:

1. **Diane QC Gate** → Validates completeness, accuracy, ethics
2. **Marco Release Gate** → Authorizes final output

See [governance.md](./governance.md) for enforcement rules.

---

## Development Workflow

### Running Tests

```bash
pnpm lint          # oxlint type-aware
pnpm build         # Full TypeScript build
pnpm test          # Unit tests (vitest)
```

### FirmOS-Specific

```bash
cd packages/firmos-programs && pnpm test   # FirmOS tests
cd firmos && npx tsx schemas/validation.ts catalogs  # Validate YAML
```

---

## Contributing

1. **Branch**: Create feature branch from `main`
2. **Code**: Follow existing patterns, use TypeScript strict
3. **Test**: Ensure `pnpm lint && pnpm test` passes
4. **PR**: Submit with clear description

### Module Contribution

To add logic to `modules/`:

```typescript
// modules/your_module/index.ts
export function yourFunction() {
  // Implement here
}

// modules/index.ts — add export
export * from "./your_module/index.js";
```

---

## Key Files

| File | Purpose |
|------|---------|
| `firmos/catalogs/agents_catalog.yaml` | Agent definitions |
| `firmos/catalogs/service_catalog.yaml` | Service → agent mapping |
| `firmos/policies/gate_policy.yaml` | QC + release gate rules |
| `schemas/*.schema.json` | YAML validation schemas |

---

## Getting Help

- **Docs**: `/docs` folder
- **Architecture**: [architecture.md](./architecture.md)
- **Gateway**: [gateway/](./gateway/)
- **FirmOS**: [governance.md](./governance.md)
