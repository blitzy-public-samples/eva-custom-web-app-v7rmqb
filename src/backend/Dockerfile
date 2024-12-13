# Stage 1: Builder
FROM node:18-alpine AS builder

# Build arguments
ARG NODE_ENV=production
ARG BUILD_VERSION=1.0.0

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV BUILD_VERSION=${BUILD_VERSION}

# Install build essentials and security updates
RUN apk update && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files with layer caching
COPY package*.json yarn.lock ./

# Install dependencies with yarn for better performance
RUN yarn install --frozen-lockfile --production=false

# Copy source code and configs
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript application with optimizations
RUN yarn build

# Prune development dependencies
RUN yarn install --frozen-lockfile --production=true

# Run security scan
RUN yarn security-audit

# Stage 2: Production
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Set secure file permissions
RUN chmod -R 550 /app && \
    chmod -R 550 /app/dist && \
    chmod -R 550 /app/node_modules

# Configure security policies
RUN mkdir -p /tmp/estate-kit && \
    chown nodejs:nodejs /tmp/estate-kit && \
    chmod 1777 /tmp/estate-kit

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set resource limits
ENV MEMORY_LIMIT=4096
ENV PIDS_LIMIT=50

# Set security options
ENV NODE_ICU_DATA=/app/node_modules/full-icu

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Set production entry point
CMD ["node", "dist/index.js"]

# Add metadata labels
LABEL maintainer="Estate Kit <devops@estatekit.com>" \
    application="estate-kit-backend" \
    version="${BUILD_VERSION}" \
    security.hipaa.compliant="true" \
    security.pipeda.compliant="true" \
    com.estatekit.git.sha="${GIT_SHA}" \
    com.estatekit.build.date="${BUILD_DATE}"

# Configure volumes
VOLUME ["/app/node_modules", "/tmp/estate-kit"]

# Set read-only root filesystem
RUN chmod 550 /app/dist/index.js

# Drop all capabilities except those required
RUN setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

# Security configurations
SECURITY_OPT="--security-opt=no-new-privileges:true --security-opt=seccomp=unconfined"

# Resource limits
RESOURCE_LIMITS="--cpus=2 --memory=4g --memory-reservation=2g --pids-limit=50 \
    --ulimit nofile=1024:2048"