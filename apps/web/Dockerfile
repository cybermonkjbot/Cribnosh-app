# Multi-stage build for monorepo from root context
FROM oven/bun:1.2.17-alpine AS deps
WORKDIR /app

# Copy root manifest and workspace manifests
COPY package.json bun.lock .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/convex/package.json ./packages/convex/

# Single install for monorepo
RUN bun install --frozen-lockfile --no-progress

# Use Node.js for build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy bun and dependencies
COPY --from=deps /usr/local/bin/bun /usr/local/bin/bun
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/apps/web/package.json ./apps/web/package.json
COPY --from=deps /app/packages/convex/package.json ./packages/convex/package.json

# Copy the rest of the source
COPY . .

# Ensure Convex generated files exist
RUN cd packages/convex && npx convex codegen

# Build the app using Node.js
WORKDIR /app/apps/web
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
# The entrypoint for standalone mode is apps/web/server.js
CMD ["node", "apps/web/server.js"]
