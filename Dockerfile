# ==============================================================================
# GameHost Deployer & Proxy — Master Panel Production Dockerfile
# Multi-stage build: builds frontend + bundles backend, runs minimal image
# Node.js 20 LTS | Alpine | Proxmox-compatible
# ==============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Dependency installer (cache layer)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY webapp/package.json ./webapp/
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: Builder — compiles React UI + bundles server.ts → server.cjs
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Vite frontend assets (outputs to dist/)
# Build esbuild backend bundle (outputs to dist/server.cjs)
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3: Production runtime — smallest possible image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Runtime system tools:
#   docker-cli      — talk to Docker socket for game server container lifecycle
#   libarchive-tools— cross-platform zip/tar extraction (bsdtar)
#   curl            — health check probe
RUN apk add --no-cache docker-cli libarchive-tools curl

# Install only production npm dependencies
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY webapp/package.json ./webapp/
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled distribution from builder
COPY --from=builder /app/dist ./dist

# Ensure persistent data directories exist (overridden by host volume mount)
RUN mkdir -p /app/data/volumes /app/data/backups

# Seed a clean db.json on first run (host volume overrides in production)
COPY data/db.json ./data/db.json

# ─── Environment ────────────────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=3000

# ─── Port ───────────────────────────────────────────────────────────────────
EXPOSE 3000

# ─── Health Check ───────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# ─── Entrypoint ─────────────────────────────────────────────────────────────
CMD ["node", "dist/server.cjs"]
