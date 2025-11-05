# Multi-stage build to avoid double installs and integrity issues on Coolify
FROM oven/bun:1.2.17-alpine AS deps
WORKDIR /app

# Force consistent registry resolution inside Docker/Coolify
COPY .npmrc ./

# Only copy manifests first for better layer caching
COPY package.json bun.lock ./

# Single install (includes dev deps for building)
RUN bun install --frozen-lockfile --no-progress


FROM oven/bun:1.2.17-alpine AS builder
WORKDIR /app

# Copy installed modules and lockfile
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/bun.lock ./bun.lock

# Copy the rest of the source
COPY . .

# Build the app
RUN bun run build


FROM oven/bun:1.2.17-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Reuse artifacts and modules from builder; do NOT reinstall in production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/node_modules ./node_modules

# Next.js outputs (adjust if you have a custom output)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["bun", "run", "start"]


