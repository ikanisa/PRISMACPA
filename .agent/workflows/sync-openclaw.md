---
description: Sync updates from OpenClaw upstream to PRISMACPA
---

# Sync OpenClaw Updates

This workflow describes how to pull the latest changes from the upstream OpenClaw repository into PRISMACPA, ensuring that custom FirmOS components (in `/firmos/`) are preserved.

## Prerequisites

- Remote `upstream` must be configured:
  ```bash
  git remote -v
  # Should show: upstream https://github.com/openclaw/openclaw.git
  ```
- Repo should be clean (no uncommitted changes).

## Sync Process

### 1. Fetch Upstream

```bash
git fetch upstream main
```

### 2. Create a Sync Branch (Recommended)

Don't merge directly into `main` without testing.

```bash
git checkout -b sync/upstream-$(date +%Y%m%d)
```

### 3. Merge Upstream

**CRITICAL**: Our repo has a custom `/firmos/` directory. OpenClaw updates are mostly in `/src/`, `/packages/clawdbot/`, etc.

```bash
git merge upstream/main
```

### 4. Handle Conflicts

Common conflict areas:
- `package.json` (version numbers, dependencies)
- `pnpm-lock.yaml`
- `src/gateway/` (if we modified gateway handlers)

**If `firmos/` files are deleted:**
If the merge tries to delete `/firmos/` (unlikely as it doesn't exist in upstream), simply restore them.
If the merge creates `/packages/firmos-core` (if upstream somehow added it, which is unlikely), move the new changes to `/firmos/core`.

### 5. Verify & Test

```bash
pnpm install
pnpm build
pnpm test
```

### 6. Commit & Push

```bash
git push origin sync/upstream-YYYYMMDD
```

## Automating (Advanced)

To automate this check, you can run:

```bash
git fetch upstream
git log --oneline HEAD..upstream/main
```
If output > 0, updates are available.
