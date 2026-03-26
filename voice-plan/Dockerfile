FROM node:22-slim AS base
WORKDIR /app

# --- Build stage ---
FROM base AS build

# Copy workspace root and package files
COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY apps/web/package.json apps/web/
COPY mcp-server/package.json mcp-server/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY packages/db/ packages/db/
COPY apps/web/ apps/web/
COPY mcp-server/ mcp-server/

# Build shared DB package first, then the web app
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/web

# --- Production stage ---
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy workspace root package files
COPY package.json package-lock.json ./
COPY packages/db/package.json packages/db/
COPY apps/web/package.json apps/web/
COPY mcp-server/package.json mcp-server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=build /app/packages/db/dist/ packages/db/dist/
COPY --from=build /app/apps/web/build/ apps/web/build/

# Copy the migration script source (needed at runtime)
COPY packages/db/src/migrate.ts packages/db/src/

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create data directory for SQLite
RUN mkdir -p /data

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
