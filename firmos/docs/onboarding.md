# FirmOS Developer Onboarding

> **Version**: 1.0  
> **Last Updated**: 2026-02-02

## Prerequisites

- Node.js 22+
- pnpm 10+
- Git (with submodule support)

## Quick Start

```bash
# Clone repository
git clone --recurse-submodules https://github.com/org/openclaw.git
cd openclaw

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## FirmOS Development

```bash
# Navigate to FirmOS
cd firmos

# Run FirmOS tests
pnpm test

# Validate catalogs
npx tsx schemas/validation.ts catalogs

# Start dashboard
cd apps/dashboard && pnpm dev
```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `firmos/catalogs/` | YAML configuration files |
| `firmos/packages/` | Core TypeScript logic |
| `firmos/modules/` | Runtime module exports |
| `firmos/schemas/` | Validation schemas |
| `firmos/tests/` | Test suites |
| `firmos/apps/` | User-facing apps |

## Key Files

| File | Description |
|------|-------------|
| `catalogs/agents_catalog.yaml` | 11 agent definitions |
| `catalogs/service_catalog.yaml` | 8 service programs |
| `packages/core/config-loader.ts` | Runtime config loader |
| `packages/programs/qc-gate-runner.ts` | QC gate execution |
| `packages/programs/release-gate-workflow.ts` | Release authorization |

## Common Tasks

### Modify Agent Configuration
1. Edit `catalogs/agents_catalog.yaml`
2. Run `pnpm test` to validate
3. Submit PR

### Add New Service
1. Define service in `catalogs/service_catalog.yaml`
2. Add task graph with owner agents
3. Update tests in `tests/`
4. Run full validation

### Create Custom QC Check
```typescript
import { registerQCCheck, type QCCheck } from '@firmos/modules/qc_gates';

const myCheck: QCCheck = {
    id: 'CUSTOM_001',
    name: 'My Custom Check',
    description: 'Validates custom rule',
    run: async (ctx) => ({
        check_id: 'CUSTOM_001',
        check_name: 'My Custom Check',
        status: 'passed',
        message: 'Check passed'
    })
};

registerQCCheck(myCheck);
```

## Testing

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Specific test file
npx vitest run tests/packs_separation.test.ts
```

## Troubleshooting

### Build Errors
```bash
pnpm clean && pnpm install && pnpm build
```

### Catalog Validation Fails
```bash
npx tsx schemas/validation.ts catalogs
```
Check error output for specific schema violations.

### Pack Access Denied
Verify agent's `allowed_packs` in `agents_catalog.yaml` includes the target pack.
