# ==============================================================================
# GameHost Deployer & Proxy Master Panel Production Dockerfile
# Multi-stage build for minimal image size and fast startup
# ==============================================================================

# STAGE 1: Build Frontend Assets and Backend Bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for maximum layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build config
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY server.ts ./

# Build production bundle (Vite + esbuild)
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install system runtime utilities:
# - docker-cli: For Docker socket communication
# - libarchive-tools (bsdtar): For cross-platform .zip/.tar.gz file extraction
# - curl: For container health checks
RUN apk add --no-cache docker-cli libarchive-tools curl

# Copy package manifests and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built distribution files from builder stage
COPY --from=builder /app/dist ./dist

# Create baseline directory structure for volume storage and atomic database
RUN mkdir -p /app/data/volumes /app/data/backups

# Copy initial clean database template if not mounted via volume
COPY data/db.json ./data/db.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose primary Web UI and API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start GameHost Master Panel
CMD ["node", "dist/server.cjs"]
