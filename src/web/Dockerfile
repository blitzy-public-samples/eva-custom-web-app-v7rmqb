# Stage 1: Builder
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies and utilities
RUN apk add --no-cache python3 make g++ \
    && npm install -g npm@latest

# Environment variables for build configuration
ARG VITE_API_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_INTERCOM_APP_ID

ENV NODE_ENV=production \
    VITE_API_URL=${VITE_API_URL} \
    VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN} \
    VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID} \
    VITE_INTERCOM_APP_ID=${VITE_INTERCOM_APP_ID}

# Copy package files with layer caching
COPY package*.json ./

# Install dependencies with cache optimization
RUN npm ci --only=production \
    && npm cache clean --force

# Copy source code (respecting .dockerignore)
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM nginx:1.24-alpine

# Install required packages and security updates
RUN apk add --no-cache curl \
    && apk upgrade --no-cache \
    && rm -rf /var/cache/apk/*

# Create nginx user and group with restricted permissions
RUN addgroup -g 101 -S nginx \
    && adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Copy NGINX configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Set correct permissions
RUN chmod -R 755 /usr/share/nginx/html \
    && chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /var/cache/nginx /var/run /var/log/nginx \
    && chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx

# Remove default nginx configuration and unnecessary files
RUN rm -rf /etc/nginx/conf.d/* \
    /usr/share/nginx/html/50x.html \
    /var/cache/nginx/* \
    /usr/share/nginx/html/*.map

# Configure security settings
RUN sed -i 's/^user nginx;/user nginx nginx;/' /etc/nginx/nginx.conf \
    && mkdir -p /var/lib/nginx/tmp \
    && chown -R nginx:nginx /var/lib/nginx \
    && chmod -R 755 /var/lib/nginx

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl --fail http://localhost:80/health || exit 1

# Set read-only root filesystem
# This must be done in the container runtime configuration
# Example: docker run --read-only

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]

# Build-time metadata
LABEL maintainer="Estate Kit Development Team" \
      version="1.0.0" \
      description="Estate Kit Frontend Application" \
      org.opencontainers.image.source="https://github.com/estate-kit/frontend" \
      org.opencontainers.image.vendor="Estate Kit" \
      org.opencontainers.image.title="Estate Kit Frontend" \
      org.opencontainers.image.description="Production-ready frontend application for Estate Kit platform" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.created="2024-02-15"
```

This Dockerfile implements a secure, optimized, and production-ready build process for the Estate Kit frontend application. Here are the key features and considerations:

1. Multi-stage Build:
- Stage 1 (builder): Uses node:18-alpine for minimal build environment
- Stage 2 (production): Uses nginx:1.24-alpine for serving static assets

2. Security Features:
- Non-root user execution
- Minimal base image with security updates
- Restricted permissions and file access
- Security headers from nginx.conf
- Read-only filesystem support
- Removal of unnecessary tools and files

3. Build Optimization:
- Layer caching for dependencies
- Production-only npm installation
- Proper ownership and permissions
- Optimized asset copying

4. Environment Configuration:
- Required build arguments for runtime configuration
- Production environment settings
- Secure handling of sensitive variables

5. Health Monitoring:
- Configured health check endpoint
- Appropriate check intervals and timeouts
- Curl-based health verification

6. Production Readiness:
- NGINX configuration integration
- Proper file permissions
- Cache optimization
- Security hardening
- Metadata labels

To build this image, use:
```bash
docker build \
  --build-arg VITE_API_URL=https://api.estate-kit.com \
  --build-arg VITE_AUTH0_DOMAIN=your-auth0-domain \
  --build-arg VITE_AUTH0_CLIENT_ID=your-auth0-client-id \
  --build-arg VITE_INTERCOM_APP_ID=your-intercom-app-id \
  -t estate-kit-frontend:1.0.0 .
```

For production deployment, run with:
```bash
docker run -d \
  --name estate-kit-frontend \
  --read-only \
  --health-cmd="curl --fail http://localhost:80/health || exit 1" \
  --health-interval=30s \
  --health-timeout=5s \
  --health-retries=3 \
  -p 80:80 \
  estate-kit-frontend:1.0.0