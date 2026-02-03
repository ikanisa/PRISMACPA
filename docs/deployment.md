# OpenClaw Deployment Guide

This guide covers deploying the OpenClaw platform to Cloudflare Pages.

---

## Architecture Overview

```
                    ┌─────────────────────────┐
                    │   Cloudflare Pages      │
                    │   (Static UI + Gateway) │
                    │   formos.pages.dev      │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   Supabase              │
                    │   (Database + Auth)     │
                    └─────────────────────────┘
```

---

## Quick Start

### Deploy UI to Cloudflare Pages

```bash
# Option A: GitHub Actions (recommended)
git push origin main
# Workflow: .github/workflows/deploy-pages.yml

# Option B: Manual
cd ui
pnpm build
npx wrangler pages deploy dist --project-name=formos
```

---

## Configuration

### Cloudflare Pages Environment Variables

Set these in the Cloudflare Pages dashboard or as GitHub secrets:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGc...` |
| `VITE_GATEWAY_URL` | Gateway WebSocket URL | `wss://gateway.example.com` |
| `VITE_GATEWAY_TOKEN` | Gateway auth token | (secret) |

### GitHub Secrets Required

| Secret | Used By | Description |
|--------|---------|-------------|
| `CLOUDFLARE_API_TOKEN` | Pages workflow | CF API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Pages workflow | CF account ID |

---

## Rollback Procedures

### Cloudflare Pages

```bash
# Via dashboard: Pages → Deployments → Rollback
# Or via CLI:
npx wrangler pages deployment list --project-name=formos
```

---

## Local Development

```bash
# Terminal 1: Gateway
pnpm dev

# Terminal 2: UI
cd ui && pnpm dev
# Opens at http://localhost:5173
```

---

## Troubleshooting

### UI not connecting to Gateway

1. Check CORS headers allow Pages origin
2. Verify `VITE_GATEWAY_URL` uses `wss://` for production
3. Check gateway is healthy: `curl https://gateway.example.com/health`

### Preview deployments not working

1. Verify `CLOUDFLARE_API_TOKEN` has Pages permissions
2. Check workflow logs in GitHub Actions
