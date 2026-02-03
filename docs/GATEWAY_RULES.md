# Gateway Connection Rules & Guardrails

> **⚠️ CRITICAL: READ BEFORE ANY GATEWAY-RELATED DEVELOPMENT**

This document defines strict rules for gateway connection handling in the OpenClaw FirmOS system.
Auth and device pairing have been deliberately **DEACTIVATED** for local development.

---

## 1. Current State (DO NOT CHANGE WITHOUT APPROVAL)

| Component | Status | Notes |
|-----------|--------|-------|
| Gateway Auth | **DEACTIVATED** | No token validation required |
| Device Pairing | **DEACTIVATED** | No pairing flow required |
| WebSocket Connection | **DIRECT** | Connects without auth handshake |

### Environment Configuration

```env
# ui/.env.local - Gateway Configuration
VITE_GATEWAY_URL=ws://127.0.0.1:19001   # Dev mode port
VITE_GATEWAY_TOKEN=<any-token>           # Token is NOT validated
```

---

## 2. RULES (MUST FOLLOW)

### Rule 1: No Auth Restoration Without Explicit Approval
- **DO NOT** re-enable gateway authentication
- **DO NOT** add token validation logic
- **DO NOT** add device pairing requirements
- If auth is needed for production, create a SEPARATE configuration

### Rule 2: Gateway Port Convention
| Mode | Port | When to Use |
|------|------|-------------|
| Dev (`--dev` flag) | `19001` | Local development |
| Production | `18789` | Production deployment |

**Always check which port the gateway is running on before troubleshooting connection issues.**

### Rule 3: Connection Error Handling
When you see `disconnected (1006): no reason`:
1. ✅ Check gateway is running: `lsof -i :19001` (or `:18789`)
2. ✅ Check `.env.local` uses correct port
3. ✅ Restart UI dev server after env changes
4. ❌ DO NOT add auth/pairing logic to "fix" this

### Rule 4: Session Keys
Session keys follow the format: `agent:<agent-id>:<session-name>`
- Example: `agent:firmos-tax:main`
- The `:main` suffix is the **session name**, not a separate "main" agent
- Every agent has a default `:main` session

---

## 3. Files That Handle Gateway Connection

| File | Purpose | Auth-Related Code |
|------|---------|-------------------|
| `ui/src/ui/gateway.ts` | WebSocket connection | Auth DISABLED |
| `ui/src/ui/device-gate.ts` | Device pairing gate | BYPASSED |
| `ui/src/ui/app-gateway.ts` | App-level gateway state | No auth checks |
| `ui/.env.local` | Environment config | Gateway URL/token |

### Code Markers
Look for these comments to understand auth status:
```typescript
// AUTH DISABLED - Direct connection without validation
// DEVICE PAIRING BYPASSED - No pairing required
```

---

## 4. Troubleshooting Quick Reference

### Problem: "Health Offline" in UI
```bash
# 1. Check if gateway is running
lsof -i :19001

# 2. If not running, start it
cd /Volumes/PRO-G40/PRISMA/openclaw && pnpm gateway:dev

# 3. Restart UI dev server
cd /Volumes/PRO-G40/PRISMA/openclaw/ui && pnpm dev
```

### Problem: "disconnected (1006): no reason"
```bash
# 1. Verify gateway port matches .env.local
grep VITE_GATEWAY_URL ui/.env.local

# 2. Ensure gateway is listening
ss -ltnp | grep 19001
```

### Problem: "main" in session dropdown
- This is NORMAL - it's the session name (`agent:X:main`)
- NOT a separate "main" agent
- Each agent has a default `:main` session

---

## 5. Future Development Guidelines

### When Adding New Features
1. **DO NOT** assume auth is required
2. **DO NOT** add conditional auth logic
3. **DO** check this document first
4. **DO** use direct WebSocket connection

### When Deploying to Production
1. Create SEPARATE production config
2. DO NOT modify local dev auth settings
3. Production auth is a SEPARATE concern

### When Debugging Connection Issues
1. Check gateway is running
2. Check port matches
3. Check env file is loaded
4. DO NOT add auth as a "fix"

---

## 6. Related Files to Review

- `/Volumes/PRO-G40/PRISMA/openclaw/ui/.env.local` - Gateway config
- `/Volumes/PRO-G40/PRISMA/openclaw/docs/ARCHITECTURE.md` - System architecture
- `/Users/jeanbosco/.openclaw/openclaw.json` - Agent configuration

---

## 7. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-03 | Initial creation - Auth deactivated for local dev | System |

---

**Remember: When in doubt, DO NOT add auth. Check this document first.**
