# ==========================================
# Stage 1: Build the TypeScript application
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code and configurations
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript (generates dist/)
RUN npm run build

# Prune development dependencies to keep only production packages
RUN npm prune --omit=dev

# ==========================================
# Stage 2: Minimal Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Security: Run as non-root user (node user is built into alpine node images)
USER node

# Copy production dependencies from builder stage
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules

# Copy compiled code from builder stage
COPY --chown=node:node --from=builder /app/dist ./dist

# Copy SQL migration files for database migrations
COPY --chown=node:node --from=builder /app/src/database ./src/database

# Expose application port
EXPOSE 3000

# Container Health Check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "dist/server.js"]
