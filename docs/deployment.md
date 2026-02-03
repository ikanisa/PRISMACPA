# OpenClaw Deployment Guide

This guide covers deploying the OpenClaw platform using a hybrid architecture:
- **UI (Dashboard)**: Cloudflare Pages — global edge, zero cold starts
- **Gateway (Backend)**: Google Cloud Run — WebSocket, long-running processes

---

## Architecture Overview

```
                    ┌─────────────────────────┐
                    │   Cloudflare Pages      │
                    │   (Static UI)           │
                    │   dashboard.pages.dev   │
                    └───────────┬─────────────┘
                                │ WebSocket
                                ▼
                    ┌─────────────────────────┐
                    │   Google Cloud Run      │
                    │   (Gateway)             │
                    │   gateway.run.app       │
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

### 1. Deploy Gateway to Cloud Run

```bash
# Option A: GitHub Actions (recommended)
git push origin main
# Workflow: .github/workflows/deploy-cloudrun.yml

# Option B: Manual
gcloud builds submit --config cloudbuild.yaml
```

### 2. Deploy UI to Cloudflare Pages

```bash
# Option A: GitHub Actions (recommended)
git push origin main
# Workflow: .github/workflows/deploy-pages.yml

# Option B: Manual
cd ui
pnpm build
npx wrangler pages deploy dist --project-name=openclaw-dashboard
```

---

## Configuration

### Cloudflare Pages Environment Variables

Set these in the Cloudflare Pages dashboard or as GitHub secrets:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGc...` |
| `VITE_GATEWAY_URL` | Cloud Run gateway URL | `wss://gateway.run.app` |
| `VITE_GATEWAY_TOKEN` | Gateway auth token | (secret) |

### GitHub Secrets Required

| Secret | Used By | Description |
|--------|---------|-------------|
| `CLOUDFLARE_API_TOKEN` | Pages workflow | CF API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Pages workflow | CF account ID |
| `GCP_PROJECT_ID` | Cloud Run workflow | GCP project ID |
| `GCP_SA_KEY` | Cloud Run workflow | Service account JSON |

---

## Rollback Procedures

### Cloudflare Pages

```bash
# Via dashboard: Pages → Deployments → Rollback
# Or via CLI:
npx wrangler pages deployment list --project-name=openclaw-dashboard
```

### Cloud Run

```bash
# List revisions
gcloud run revisions list --service=openclaw-gateway --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic openclaw-gateway \
  --to-revisions=<revision-name>=100 \
  --region=us-central1
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
3. Check Cloud Run service is healthy: `curl https://gateway.run.app/health`

### Cold start issues on Cloud Run

1. Increase `min-instances` to 1 in Cloud Run config
2. Use Cloud Run CPU boost (enabled by default)

### Preview deployments not working

1. Verify `CLOUDFLARE_API_TOKEN` has Pages permissions
2. Check workflow logs in GitHub Actions
