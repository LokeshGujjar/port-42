#!/bin/bash

# 🚀 Port42 Production Deployment Script
# Automates the deployment process for Port42 platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="port42"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
LOG_FILE="./deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker first."
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    mkdir -p $BACKUP_DIR
    BACKUP_NAME="backup_$(date +'%Y%m%d_%H%M%S')"
    
    # Backup database
    if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q port42-db; then
        log "Backing up database..."
        docker-compose -f $DOCKER_COMPOSE_FILE exec -T port42-db mongodump --archive > "$BACKUP_DIR/${BACKUP_NAME}_db.archive"
        success "Database backup created"
    fi
    
    # Backup uploaded files
    if [ -d "./uploads" ]; then
        log "Backing up uploaded files..."
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" ./uploads
        success "Files backup created"
    fi
    
    success "Backup completed: $BACKUP_NAME"
}

# Build application
build_application() {
    log "Building application..."
    
    # Build frontend
    log "Building frontend..."
    cd frontend
    npm ci
    npm run build
    cd ..
    success "Frontend built successfully"
    
    # Build Docker image
    log "Building Docker image..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    success "Docker image built successfully"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Check health
    check_health
    
    success "Application deployed successfully"
}

# Check application health
check_health() {
    log "Checking application health..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $DOCKER_COMPOSE_FILE exec -T port42-app node backend/utils/healthcheck.js; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check failed (attempt $attempt/$max_attempts), retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [ -z "$DOMAIN" ]; then
        warning "DOMAIN environment variable not set, skipping SSL setup"
        return 0
    fi
    
    # Create SSL directory
    mkdir -p ./docker/ssl
    
    # Generate certificates using certbot
    if command -v certbot &> /dev/null; then
        log "Generating SSL certificate for $DOMAIN..."
        sudo certbot certonly --standalone -d $DOMAIN --agree-tos --no-eff-email --email admin@$DOMAIN
        
        # Copy certificates
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./docker/ssl/
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./docker/ssl/
        sudo chown $USER:$USER ./docker/ssl/*
        
        success "SSL certificates configured"
    else
        warning "Certbot not found, SSL setup skipped"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p ./logs/nginx
    mkdir -p ./monitoring
    
    # Setup log rotation
    if command -v logrotate &> /dev/null; then
        cat > ./monitoring/logrotate.conf << EOF
./logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 $USER $USER
}
EOF
        success "Log rotation configured"
    fi
    
    success "Monitoring setup completed"
}

# Cleanup old backups and images
cleanup() {
    log "Cleaning up..."
    
    # Remove old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        log "Removing old backups..."
        ls -t $BACKUP_DIR/backup_* | tail -n +6 | xargs -r rm
    fi
    
    # Remove unused Docker images
    log "Removing unused Docker images..."
    docker image prune -f
    
    success "Cleanup completed"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --backup-only     Create backup only"
    echo "  --no-backup      Skip backup creation"
    echo "  --no-ssl         Skip SSL setup"
    echo "  --no-monitoring  Skip monitoring setup"
    echo "  --help           Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  DOMAIN           Domain name for SSL certificates"
    echo ""
}

# Main deployment function
main() {
    log "Starting Port42 deployment..."
    
    # Parse arguments
    SKIP_BACKUP=false
    BACKUP_ONLY=false
    SKIP_SSL=false
    SKIP_MONITORING=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-only)
                BACKUP_ONLY=true
                shift
                ;;
            --no-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --no-ssl)
                SKIP_SSL=true
                shift
                ;;
            --no-monitoring)
                SKIP_MONITORING=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Check environment
    check_root
    check_prerequisites
    
    # Create backup
    if [ "$SKIP_BACKUP" = false ]; then
        create_backup
    fi
    
    # If backup only, exit here
    if [ "$BACKUP_ONLY" = true ]; then
        success "Backup completed successfully"
        exit 0
    fi
    
    # Build and deploy
    build_application
    deploy_application
    
    # Setup SSL
    if [ "$SKIP_SSL" = false ]; then
        setup_ssl
    fi
    
    # Setup monitoring
    if [ "$SKIP_MONITORING" = false ]; then
        setup_monitoring
    fi
    
    # Cleanup
    cleanup
    
    success "Port42 deployment completed successfully!"
    log "Application is running at:"
    
    if [ -n "$DOMAIN" ]; then
        log "  https://$DOMAIN"
        log "  http://$DOMAIN"
    else
        log "  http://localhost"
    fi
    
    log "Monitoring:"
    log "  Prometheus: http://localhost:9090"
    log "  Logs: http://localhost:3100"
    
    log "To view logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    log "To check status: docker-compose -f $DOCKER_COMPOSE_FILE ps"
}

# Run main function
main "$@"
