# Migration Map — OpenClaw FirmOS Restructure

> Maps current paths → target paths for the restructure workflow

## Legend

| Action | Meaning |
|--------|---------|
| **KEEP** | Path remains unchanged |
| **MOVE** | Path moves to new location |
| **EXTRACT** | Code extracted into new module |
| **CONSOLIDATE** | Multiple sources merged |

---

## Apps

| Current | Target | Action | Notes |
|---------|--------|--------|-------|
| `apps/dashboard/` | `apps/dashboard/` | KEEP | Already in correct location |
| `apps/api/` | `apps/api/` | KEEP | Already in correct location |
| `apps/firmos/` | `apps/firmos/` | KEEP | FirmOS control app |
| `apps/macos/` | `apps/macos/` | KEEP | Native app |
| `apps/ios/` | `apps/ios/` | KEEP | Native app |
| `apps/android/` | `apps/android/` | KEEP | Native app |

---

## Packages → Modules Extraction

| Current | Target | Action | Notes |
|---------|--------|--------|-------|
| `packages/firmos-programs/routing.ts` | `modules/routing/` | EXTRACT | Agent task routing |
| `packages/firmos-programs/qc-gate-runner.ts` | `modules/qc_gates/` | EXTRACT | Diane enforcement |
| `packages/firmos-programs/release-gate-workflow.ts` | `modules/release_gates/` | EXTRACT | Marco authorization |
| `packages/firmos-programs/template-factory.ts` | `modules/template_factory/` | EXTRACT | Pack-scoped templates |
| `packages/firmos-core/src/evidence-taxonomy.ts` | `modules/evidence/` | EXTRACT | Evidence linking |
| `src/gateway/` | `apps/api/gateway/` OR keep | KEEP | Evaluate later |

---

## Config → FirmOS Constitution

| Current | Target | Action | Notes |
|---------|--------|--------|-------|
| `packages/firmos-agents/*.yaml` | `firmos/agents/` | MOVE | Agent personas/prompts |
| `packages/firmos-programs/*.yaml` | `firmos/catalogs/` | MOVE | Service programs |
| `packages/firmos-policies/src/policies.ts` | `firmos/policies/*.yaml` | CONSOLIDATE | Convert to YAML |
| (new) | `firmos/catalogs/service_catalog.yaml` | NEW | Extracted from TS |
| (new) | `firmos/catalogs/agents_catalog.yaml` | NEW | Extracted from TS |
| (new) | `firmos/policies/gate_policy.yaml` | NEW | QC gate rules |
| (new) | `firmos/policies/autonomy_policy.yaml` | NEW | Agent autonomy tiers |

---

## Schemas (New)

| Target | Purpose | Source |
|--------|---------|--------|
| `schemas/service_catalog.schema.json` | Validate service_catalog.yaml | From firmos-programs types |
| `schemas/agent.schema.json` | Validate agent definitions | From firmos-agents types |
| `schemas/policy.schema.json` | Validate policies | From firmos-policies types |

---

## No Changes Required

| Path | Reason |
|------|--------|
| `channels/` | Messaging channels, stable |
| `extensions/` | Plugin extensions, stable |
| `skills/` | Skill definitions, stable |
| `ui/` | Control UI, stable |
| `supabase/` | DB config, stable |
| `.github/workflows/` | CI, will update paths if needed |

---

## Risky Moves (Requires Careful Migration)

| Path | Risk | Mitigation |
|------|------|------------|
| `packages/firmos-programs/service-programs.ts` (34KB) | Large file, many imports | Extract incrementally, keep re-exports |
| `packages/firmos-programs/service-catalog.ts` (29KB) | Large file, master catalog | Split by domain, validate schema |
| `packages/firmos-agents/l5-agents.ts` (39KB) | L5 agent definitions | May need refactor, not move |

---

## Import Path Strategy

After restructure, maintain backward compatibility with re-exports:

```typescript
// packages/firmos-programs/index.ts — compatibility layer
export * from "../../modules/routing/index.js";
export * from "../../modules/qc_gates/index.js";
export * from "../../modules/release_gates/index.js";
```

Mark with `@deprecated` and remove in v2027.
