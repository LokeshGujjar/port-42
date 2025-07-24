# 🐳 Port42 Production Dockerfile
# Multi-stage build for optimized production deployment

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Stage 3: Production Runtime
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    tini \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S port42 -u 1001

# Set working directory
WORKDIR /app

# Copy backend files
COPY --from=backend-build --chown=port42:nodejs /app/backend ./backend
COPY --from=frontend-build --chown=port42:nodejs /app/frontend/dist ./frontend/dist

# Create logs directory
RUN mkdir -p logs && chown port42:nodejs logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node backend/utils/healthcheck.js

# Switch to non-root user
USER port42

# Expose port
EXPOSE 5000

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "backend/server.js"]
