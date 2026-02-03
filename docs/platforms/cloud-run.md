---
summary: "Deploy OpenClaw Gateway to Google Cloud Run (serverless container platform)"
read_when:
  - You want OpenClaw running on Cloud Run (serverless, auto-scaling)
  - You want pay-per-use pricing with automatic scaling
  - You don't need persistent local state between requests
title: "Cloud Run"
---

# OpenClaw on Google Cloud Run

## Overview

Cloud Run is Google's serverless container platform that automatically scales based on traffic and charges only for actual usage. This guide covers deploying the OpenClaw Gateway to Cloud Run.

### Key Considerations for Cloud Run

| Feature | Cloud Run Behavior | OpenClaw Impact |
|---------|-------------------|-----------------|
| **Stateless** | Containers can be stopped anytime | Session state requires external storage |
| **Cold Starts** | New instances take time to initialize | Set min-instances ≥ 1 for always-on |
| **WebSockets** | Supported with session affinity | Requires gen2 execution environment |
| **Request Timeout** | Max 3600s (1 hour) | Long-running operations need redesign |
| **CPU Throttling** | CPU only allocated during requests | Background tasks may be throttled |
| **Scaling** | 0 to N instances automatically | WebSocket connections may be interrupted |

### When to Use Cloud Run vs Compute Engine

| Use Case | Recommendation |
|----------|---------------|
| Development/testing | Cloud Run (pay-per-use) |
| Low traffic, occasional use | Cloud Run (cost-effective) |
| Production with 24/7 availability | Compute Engine (see [GCP](/platforms/gcp)) |
| Persistent WebSocket connections | Compute Engine |
| Long-running background tasks | Compute Engine |

---

## Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed locally (for testing)
- OpenClaw repository cloned

### Initial Setup

```bash
# Authenticate with GCP
gcloud auth login
gcloud auth configure-docker

# Create or select a project
gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
gcloud config set project my-openclaw-project

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com
```

---

## Quick Deploy (Recommended)

### 1. Create Gateway Token Secret

```bash
# Generate a secure token
GATEWAY_TOKEN=$(openssl rand -hex 32)

# Store in Secret Manager
gcloud secrets create openclaw-gateway-token --replication-policy="automatic"
echo -n "$GATEWAY_TOKEN" | gcloud secrets versions add openclaw-gateway-token --data-file=-

# Grant Cloud Run access to the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding openclaw-gateway-token \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 2. Deploy Using Cloud Build

```bash
cd /path/to/openclaw

# Deploy to Cloud Run
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_SERVICE_NAME=openclaw-gateway
```

### 3. Get the Service URL

```bash
gcloud run services describe openclaw-gateway \
  --region=us-central1 \
  --format='value(status.url)'
```

---

## Manual Deploy (Alternative)

If you prefer to deploy without Cloud Build:

### 1. Build and Push Image

```bash
# Build the image
docker build -t gcr.io/$PROJECT_ID/openclaw-gateway:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/openclaw-gateway:latest
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy openclaw-gateway \
  --image=gcr.io/$PROJECT_ID/openclaw-gateway:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --min-instances=1 \
  --max-instances=10 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=3600 \
  --concurrency=80 \
  --execution-environment=gen2 \
  --cpu-boost \
  --session-affinity \
  --set-env-vars=NODE_ENV=production,PORT=8080 \
  --set-secrets=OPENCLAW_GATEWAY_TOKEN=openclaw-gateway-token:latest
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Port to listen on (Cloud Run sets this) |
| `NODE_ENV` | Yes | Set to `production` |
| `OPENCLAW_GATEWAY_TOKEN` | Yes | Authentication token (from Secret Manager) |
| `OPENCLAW_GATEWAY_BIND` | No | Network binding (default: `lan`) |

### Cloud Run Service Settings

For optimal performance with WebSocket workloads:

```yaml
# Recommended settings
min-instances: 1        # Avoid cold starts for always-on
max-instances: 10       # Limit concurrent instances
memory: 2Gi             # Sufficient for Node.js + agents
cpu: 2                  # 2 vCPUs for responsiveness
timeout: 3600           # 1 hour max (WebSocket sessions)
concurrency: 80         # Connections per instance
execution-environment: gen2  # Required for WebSockets
session-affinity: true  # Sticky sessions for WebSockets
cpu-boost: true         # Faster cold starts
```

---

## Health Checks

Cloud Run uses HTTP health checks to determine container readiness.

The OpenClaw Gateway exposes a health endpoint that Cloud Run can use:

```bash
# Test the health endpoint
curl https://YOUR-SERVICE-URL.run.app/health
```

### Configuring Health Check Path

If you need a custom health check path, add to your deployment:

```bash
--startup-cpu-boost \
--startup-probe=http-get,path=/health,initial-delay-seconds=0
```

---

## Connecting Clients

### From Browser (Control UI)

Update the dashboard's environment variables:

```bash
# apps/dashboard/.env.local
VITE_GATEWAY_URL=wss://openclaw-gateway-XXXXXX-uc.a.run.app
VITE_GATEWAY_TOKEN=your-gateway-token
```

### From CLI

```bash
openclaw config set gateway.url wss://openclaw-gateway-XXXXXX-uc.a.run.app
openclaw config set gateway.token your-gateway-token
```

---

## State Persistence

Cloud Run containers are ephemeral. For persistent state, use:

### Option 1: Cloud Storage (Recommended)

Mount a Cloud Storage bucket as a volume:

```bash
# Create a bucket
gsutil mb gs://my-openclaw-state

# Add volume mount to deployment
gcloud run services update openclaw-gateway \
  --region=us-central1 \
  --add-volume=name=state,type=cloud-storage,bucket=my-openclaw-state \
  --add-volume-mount=volume=state,mount-path=/home/node/.openclaw
```

### Option 2: Firestore/Redis

For session state, use Firestore or Cloud Memorystore (Redis).

---

## Monitoring

### View Logs

```bash
# Stream logs
gcloud run services logs tail openclaw-gateway --region=us-central1

# View recent logs
gcloud run services logs read openclaw-gateway --region=us-central1 --limit=100
```

### Metrics

View in Cloud Console:
- Request latency
- Container instance count
- Memory utilization
- CPU utilization

---

## Cost Estimation

Cloud Run pricing (us-central1):

| Resource | Price | Notes |
|----------|-------|-------|
| CPU | $0.00002400/vCPU-second | Only charged when processing requests |
| Memory | $0.00000250/GiB-second | Only charged when processing requests |
| Requests | $0.40/million | First 2 million free per month |
| Min instances | Always-on CPU + Memory | Charged continuously |

### Example: Light Usage (1 min-instance, 100 requests/day)

```
Min instance (2 vCPU, 2GB, 24/7):
  CPU: 2 × 86400 × 30 × $0.00002400 = $124.42/month
  Memory: 2 × 86400 × 30 × $0.00000250 = $12.96/month
  Total: ~$137/month
```

**Note**: For 24/7 availability, Compute Engine is often more cost-effective (~$12-50/month for e2-small).

---

## Troubleshooting

### Cold Start Issues

If experiencing slow cold starts:

1. Increase `min-instances` to 1 or more
2. Enable `--cpu-boost` for faster startup
3. Optimize Dockerfile for smaller image size
4. Use multi-stage builds to reduce image size

### WebSocket Connection Drops

Cloud Run may scale down instances during low traffic:

1. Set `min-instances >= 1` for always-on
2. Enable `session-affinity` for sticky sessions
3. Implement client-side reconnection logic

### Permission Denied Errors

Ensure the Cloud Run service account has required permissions:

```bash
# Grant Secret Manager access
gcloud secrets add-iam-policy-binding openclaw-gateway-token \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

### Container Crashes

Check logs for startup errors:

```bash
gcloud run services logs read openclaw-gateway \
  --region=us-central1 \
  --limit=50
```

Common issues:
- Missing environment variables
- Port mismatch (must use PORT env var)
- Memory exhaustion (increase memory allocation)

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy-cloudrun.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - uses: google-github-actions/setup-gcloud@v2
      
      - name: Deploy
        run: |
          gcloud builds submit --config cloudbuild.yaml \
            --substitutions=_REGION=us-central1
```

---

## Next Steps

- Configure messaging channels: [Channels](/channels)
- Set up model authentication: [Models](/models)
- For persistent workloads, consider [GCP Compute Engine](/platforms/gcp)
