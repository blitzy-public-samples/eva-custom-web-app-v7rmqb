# Requirement: Backend Containerization
# Location: Technical Specifications/4.5 Development & Deployment
# Description: Provides a containerized environment for the backend services

# Use Node.js 18 LTS as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install Python and build dependencies for node-gyp
RUN apk add --no-cache python3 make g++ gcc

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary configuration files
COPY tsconfig.json .
COPY .env.production .env

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set ownership and permissions
RUN chown -R appuser:appgroup /app
USER appuser

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]

# Human Tasks:
# 1. Configure environment variables in .env.production file
# 2. Set up proper logging configuration for containerized environment
# 3. Configure container monitoring and health check endpoints
# 4. Review security settings and user permissions
# 5. Set up container orchestration (e.g., Kubernetes) configuration
# 6. Configure container registry access and deployment pipelines
# 7. Set up proper backup and disaster recovery procedures
# 8. Review and adjust container resource limits
# 9. Configure network policies and security groups
# 10. Set up SSL/TLS certificates for HTTPS