# Migration Map: OpenClaw → FirmOS Restructure

> Mapping of current paths to target paths with action notes.
> Generated: 2026-02-02

---

## Legend

| Action | Meaning |
|--------|---------|
| ✅ KEEP | Already in correct location |
| 🔄 ALIAS | Create import alias (no file move) |
| 📁 NEW | New directory/file to create |
| ⚠️ DEPRECATE | Mark for future removal |

---

## Apps

| Current Path | Target Path | Action | Notes |
|--------------|-------------|--------|-------|
| `apps/android/` | `apps/android/` | ✅ KEEP | Native Android app |
| `apps/ios/` | `apps/ios/` | ✅ KEEP | Native iOS app |
| `apps/macos/` | `apps/macos/` | ✅ KEEP | Native macOS app |
| `apps/shared/` | `apps/shared/` | ✅ KEEP | OpenClawKit shared |
| `apps/prisma-cpa/` | — | ⚠️ DEPRECATE | Legacy, consolidate into FirmOS |

---

## FirmOS (Already Structured)

| Current Path | Target Path | Action | Notes |
|--------------|-------------|--------|-------|
| `firmos/apps/api/` | `firmos/apps/api/` | ✅ KEEP | FirmOS REST API |
| `firmos/apps/dashboard/` | `firmos/apps/dashboard/` | ✅ KEEP | React dashboard |
| `firmos/catalogs/` | `firmos/catalogs/` | ✅ KEEP | 5 YAML catalogs |
| `firmos/packages/agents/` | `firmos/packages/agents/` | ✅ KEEP | 11 agent manifests |
| `firmos/packages/core/` | `firmos/packages/core/` | ✅ KEEP | Core types |
| `firmos/packages/packs/` | `firmos/packages/packs/` | ✅ KEEP | MT/RW packs |
| `firmos/packages/policies/` | `firmos/packages/policies/` | ✅ KEEP | Autonomy policies |
| `firmos/packages/programs/` | `firmos/packages/programs/` | ✅ KEEP | Service programs |
| `firmos/packages/tools/` | `firmos/packages/tools/` | ✅ KEEP | Tool registry |
| `firmos/tests/` | `firmos/tests/` | ✅ KEEP | FirmOS tests |
| — | `firmos/schemas/` | 📁 NEW | Validation schemas |
| — | `firmos/modules/` | 📁 NEW | Runtime modules |

---

## New Modules (To Create)

| Module | Source | Action | Notes |
|--------|--------|--------|-------|
| `firmos/modules/audit_log/` | `firmos/packages/policies/src/incident-log.ts` | 🔄 ALIAS | Re-export from policies |
| `firmos/modules/qc_gates/` | `firmos/packages/programs/validation.ts` | 🔄 ALIAS | Diane gate logic |
| `firmos/modules/release_gates/` | New | 📁 NEW | Marco release workflow |
| `firmos/modules/routing/` | `firmos/packages/programs/service-programs.ts` | 🔄 ALIAS | Program routing |
| `firmos/modules/evidence/` | `firmos/packages/evidence/` | 🔄 ALIAS | Evidence collection |
| `firmos/modules/template_factory/` | `firmos/packages/programs/template-factory.ts` | 🔄 ALIAS | Template management |
| `firmos/modules/case_mgmt/` | New | 📁 NEW | Case/engagement logic |

---

## New Schemas (To Create)

| Schema | Source YAML | Action |
|--------|-------------|--------|
| `firmos/schemas/agents_catalog.schema.json` | `catalogs/agents_catalog.yaml` | 📁 NEW |
| `firmos/schemas/service_catalog.schema.json` | `catalogs/service_catalog.yaml` | 📁 NEW |
| `firmos/schemas/skills_matrix.schema.json` | `catalogs/skills_matrix.yaml` | 📁 NEW |
| `firmos/schemas/resource_library.schema.json` | `catalogs/resource_library.yaml` | 📁 NEW |
| `firmos/schemas/template_catalog.schema.json` | `catalogs/template_catalog.yaml` | 📁 NEW |
| `firmos/schemas/validation.ts` | — | 📁 NEW |

---

## Path Aliases (tsconfig.json)

| Alias | Target | Status |
|-------|--------|--------|
| `@firmos/*` | `firmos/packages/*` | 📁 NEW |
| `@firmos/modules/*` | `firmos/modules/*` | 📁 NEW |
| `@openclaw/*` | `src/*` | 📁 NEW |

---

## Core src/ (No Changes)

The `src/` directory remains unchanged. FirmOS modules will re-export from it where needed.

| Path | Action | Notes |
|------|--------|-------|
| `src/gateway/` | ✅ KEEP | Gateway server |
| `src/agents/` | ✅ KEEP | Agent runtime |
| `src/channels/` | ✅ KEEP | Channel adapters |
| `src/config/` | ✅ KEEP | Configuration |
| `src/memory/` | ✅ KEEP | Memory/vector |
| All other `src/*` | ✅ KEEP | No changes |

---

## Summary

| Category | Keep | New | Alias | Deprecate |
|----------|------|-----|-------|-----------|
| Apps | 4 | 0 | 0 | 1 |
| FirmOS | 10 | 2 | 0 | 0 |
| Modules | 0 | 2 | 5 | 0 |
| Schemas | 0 | 6 | 0 | 0 |
| Aliases | 0 | 3 | 0 | 0 |
| **Total** | **14** | **13** | **5** | **1** |

**Impact**: Minimal file moves. Mostly adding new structure and aliases.
