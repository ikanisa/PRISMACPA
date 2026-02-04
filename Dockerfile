FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

ARG OPENCLAW_DOCKER_APT_PACKAGES=""
RUN if [ -n "$OPENCLAW_DOCKER_APT_PACKAGES" ]; then \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $OPENCLAW_DOCKER_APT_PACKAGES && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
  fi

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts
COPY firmos/modules/package.json ./firmos/modules/package.json
COPY firmos/modules/programs ./firmos/modules/programs

RUN pnpm install --frozen-lockfile

COPY . .
# Build the TypeScript project
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# PORT env var can be set by container orchestrator (default 8080)
# Gateway needs --allow-unconfigured for deployment and --bind lan for external access
# Note: tsc outputs to dist/src/ because include is "src/**/*" which preserves structure
# Using 'gateway' directly (not 'gateway run') as tested locally
# OPENCLAW_CONFIG_PATH can be set via env var to point to /app/openclaw.cloud.json
CMD ["sh", "-c", "node dist/src/index.js gateway --port ${PORT:-8080} --allow-unconfigured --bind lan"]
