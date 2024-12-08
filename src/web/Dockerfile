# Build stage
# Requirements addressed: Frontend Deployment (Technical Specifications/4.5 Development & Deployment/Deployment Pipeline)
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies using clean install for production
RUN npm ci

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.21-alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port for Nginx
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]

# Add labels for container metadata
LABEL maintainer="Estate Kit Development Team" \
      version="1.0.0" \
      description="Estate Kit Frontend Application" \
      org.estatekit.component="frontend"

# Configure health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:80/ || exit 1