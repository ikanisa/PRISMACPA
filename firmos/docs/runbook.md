# FirmOS Operations Runbook

> **Version**: 1.0  
> **Last Updated**: 2026-02-02

## Health Checks

### Verify Catalog Validity
```bash
cd firmos
npx tsx schemas/validation.ts catalogs
```

**Expected**: All catalogs pass validation.

### Run Test Suite
```bash
cd firmos
pnpm test
```

**Expected**: 120+ tests pass (some pre-existing failures may exist).

### Check Build
```bash
pnpm build
```

**Expected**: No TypeScript errors.

---

## Common Operations

### Deploy Config Changes
1. Update YAML catalog in `firmos/catalogs/`
2. Validate: `npx tsx schemas/validation.ts catalogs`
3. Test: `pnpm test`
4. Commit and push
5. CI validates automatically

### Add New Agent
1. Add entry to `catalogs/agents_catalog.yaml`:
```yaml
- id: agent_newname
  name: New Agent
  title: New Agent Title
  role: service_delivery
  owns_services: []
  supports_services: []
  allowed_packs: [GLOBAL]
  allowed_tools: [CORE_CASE_MGMT]
```
2. Add skills to `catalogs/skills_matrix.yaml`
3. Add system prompt to `packages/agents/prompts/`
4. Test and deploy

### Rollback Release
```typescript
import { rollbackRelease } from '@firmos/modules/release_gates';

const result = await rollbackRelease('release_id', 'Reason for rollback');
```

---

## Incident Response

### QC Gate Failure
1. Check QC result details in logs
2. Identify failing check (evidence/pack/output)
3. Fix underlying issue
4. Re-run QC gate

### Pack Boundary Violation
1. Identify agent attempting cross-pack access
2. Verify agent's `allowed_packs` configuration
3. Either:
   - Add pack to agent's allowed list (if authorized)
   - Block the operation (if unauthorized)

### Release Authorization Stuck
1. Check release status: `getReleaseWorkflow(releaseId)`
2. If `qc_in_progress`: Wait or check QC runner
3. If `qc_failed`: Fix issues and retry
4. If `pending`: Contact Marco (or operator override)

---

## Monitoring Points

| Metric | Location | Threshold |
|--------|----------|-----------|
| Test pass rate | CI | >95% |
| Catalog validation | CI `firmos-validate` | 100% |
| QC gate pass rate | Runtime logs | >90% |
| Release reject rate | Audit log | <10% |

---

## Contacts

| Role | Contact |
|------|---------|
| Orchestrator | Aline (agent_aline) |
| Governor | Marco (agent_marco) |
| Guardian | Diane (agent_diane) |
| Operator | Human escalation |

---

## Recovery Procedures

### Config Corruption
```bash
git checkout HEAD -- firmos/catalogs/
```

### Test Suite Regression
```bash
git bisect start
git bisect bad HEAD
git bisect good <last-known-good>
```

### Full Reset
```bash
pnpm clean
rm -rf node_modules firmos/node_modules
pnpm install
pnpm build
```
