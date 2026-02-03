# OpenClaw + FirmOS Operations Runbook

> **Version**: 2026.1.30  
> **Last Updated**: 2026-02-03

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start gateway | `pnpm dev gateway` |
| Start UI dev | `cd ui && pnpm dev` |
| Run tests | `pnpm test` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |

---

## 1. System Health Check

### Gateway Health
```bash
# Check if gateway is running
curl http://127.0.0.1:18789/health

# Expected response:
# {"status":"ok","version":"2026.1.30"}
```

### UI Dashboard Health
```bash
# Should load at
open http://localhost:5173
```

---

## 2. Starting Services

### Development Mode
```bash
# Terminal 1: Start gateway
pnpm dev gateway

# Terminal 2: Start UI (optional, for hot reload)
cd ui && pnpm dev
```

### Production Mode
```bash
# Build first
pnpm build

# Start gateway in production
node dist/src/entry.js gateway
```

---

## 3. Stopping Services

### Graceful Shutdown
```bash
# Press Ctrl+C in the terminal running the gateway
# Or send SIGTERM to the process
kill -TERM <pid>
```

### Force Stop (if unresponsive)
```bash
# Find process
lsof -i :18789

# Kill
kill -9 <pid>
```

---

## 4. Log Locations

| Log Type | Location |
|----------|----------|
| Gateway logs | Console (stdout/stderr) |
| Session transcripts | `~/.openclaw/agents/<agent-id>/sessions/*.jsonl` |
| Error tracking | Sentry dashboard (when configured) |

### Viewing Session History
```bash
# List all sessions for an agent
ls ~/.openclaw/agents/<agent-id>/sessions/

# View a specific session
cat ~/.openclaw/agents/<agent-id>/sessions/<session>.jsonl | jq
```

---

## 5. Database Operations (Supabase)

### Check Migration Status
```bash
cd supabase
supabase db diff
```

### Apply Migrations
```bash
supabase db push
```

### Rollback Migration
```bash
# Revert last migration (requires manual SQL)
# 1. Identify migration to revert
ls supabase/migrations/

# 2. Create rollback script
# 3. Apply via Supabase dashboard or CLI
```

---

## 6. Environment Variables

### Required (Gateway)
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |

### Required (UI)
| Variable | Description |
|----------|-------------|
| `VITE_GATEWAY_URL` | Gateway WebSocket URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

### Optional (Error Tracking)
| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry Data Source Name |
| `SENTRY_ENVIRONMENT` | Environment (development/staging/production) |

---

## 7. Error Tracking (Sentry)

### Setup
1. Create project at https://sentry.io
2. Get DSN from project settings
3. Set environment variables:
```bash
export SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
export SENTRY_ENVIRONMENT="production"
```

### Viewing Errors
- Dashboard: https://sentry.io/organizations/<org>/issues/
- Filter by: `environment:production`

---

## 8. Incident Response

### P1: Gateway Unreachable
1. Check if process is running: `lsof -i :18789`
2. Check logs for errors
3. Restart: `pnpm dev gateway`
4. Verify: `curl http://127.0.0.1:18789/health`

### P2: Authentication Failures
1. Verify Supabase credentials
2. Check Google OAuth config
3. Clear browser localStorage
4. Re-authenticate

### P3: Slow Response Times
1. Check API rate limits (Anthropic)
2. Review recent session logs
3. Restart gateway if memory bloat suspected

---

## 9. Backup & Recovery

### What to Backup
- `~/.openclaw/` directory (agent configs, sessions)
- `.env` and `.env.local` files
- Supabase data (via dashboard export)

### Backup Command
```bash
tar -czvf openclaw-backup-$(date +%Y%m%d).tar.gz \
  ~/.openclaw/ \
  .env .env.local
```

### Restore
```bash
tar -xzvf openclaw-backup-YYYYMMDD.tar.gz -C /
```

---

## 10. Support Contacts

| Role | Contact |
|------|---------|
| Primary On-Call | TBD |
| Escalation | TBD |
| Supabase Support | https://supabase.com/dashboard/support |
| Anthropic Support | https://console.anthropic.com/support |

---

## Appendix: Key Files

| File | Purpose |
|------|---------|
| `package.json` | Project config, scripts |
| `openclaw.json` | Gateway configuration |
| `ui/.env.local` | UI environment |
| `supabase/config.toml` | Supabase local config |
