# Multi-stage production Dockerfile for Vercel Containers & Docker Deployments
# Stage 1: Build environment with native C++ compilation tools
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native compilation dependencies required by better-sqlite3 (node-gyp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy root and client dependency specifications first for optimal layer caching
COPY package*.json ./
COPY client/package*.json ./client/

# Clean install dependencies with lockfile reproducibility and peer-dependency tolerance
RUN npm ci --legacy-peer-deps
RUN npm --prefix client ci --legacy-peer-deps

# Copy application source code
COPY . .

# Build Vite frontend production bundle
RUN npm --prefix client run build

# Prune development dependencies from root to keep production node_modules minimal
RUN npm prune --omit=dev

# Stage 2: Ultra-lightweight Production Runtime
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy root package.json for npm scripts
COPY package.json ./

# Copy pre-compiled native node_modules from builder (no build tools needed in runner)
COPY --from=builder /app/node_modules ./node_modules

# Copy server code and pre-compiled client bundle from builder
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/client/public ./client/public

# Persistent volume directory for SQLite database
RUN mkdir -p /app/data
ENV DB_PATH=/app/data/driving_school.sqlite

EXPOSE 5000

CMD ["npm", "start"]
