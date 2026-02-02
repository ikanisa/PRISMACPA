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

RUN pnpm install --frozen-lockfile

COPY . .
# Show what TypeScript will actually compile (debug)
RUN echo "=== Directory structure ===" && ls -la . | head -20
RUN echo "=== Files in src/ ===" && ls -la src/ 2>&1 | head -30 || echo "src/ not found or empty"
RUN echo "=== Looking for *.ts files ===" && find . -maxdepth 2 -name "*.ts" | head -20 || true
# Run tsc explicitly to see errors (not via pnpm build which may swallow errors)
RUN echo "=== Checking for src/index.ts ===" && ls -la src/index.ts || echo "ERROR: src/index.ts not found!"
RUN echo "=== Running tsc explicitly ===" && npx tsc -p tsconfig.json --noEmit false 2>&1 || echo "TSC FAILED"
# Also run the normal build for the rest of the artifacts
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build || echo "PNPM BUILD FAILED (might be expected if tsc is the issue)"
# Verify the dist was created correctly (debug)
RUN echo "=== Build complete. Checking dist/ ===" && ls -la dist/ | head -20
RUN echo "=== Checking for dist/index.js ===" && ls -la dist/index.* || echo "ERROR: dist/index.js not found!"
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Cloud Run provides PORT env var (default 8080)
# Gateway needs --allow-unconfigured for deployment and --bind lan for external access
CMD ["sh", "-c", "node dist/index.js gateway run --port ${PORT:-8080} --allow-unconfigured --bind lan"]
