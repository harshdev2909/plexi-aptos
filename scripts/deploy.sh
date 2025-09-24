#!/bin/bash

# PlexiX Backend Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environment: development (default) | production

set -e

ENVIRONMENT=${1:-development}
PROJECT_NAME="plexix"
COMPOSE_FILE="docker-compose.yml"

echo "🚀 Deploying PlexiX Backend - Environment: $ENVIRONMENT"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from template..."
        cp env.example .env
        log_warning "Please edit .env file with your configuration before continuing."
        read -p "Press Enter to continue after editing .env file..."
    fi
    
    log_success "Prerequisites check completed"
}

# Validate environment file
validate_env() {
    log_info "Validating environment configuration..."
    
    required_vars=(
        "VAULT_MODULE_ADDRESS"
        "PRIVATE_KEY"
        "ADMIN_JWT_SECRET"
        "ADMIN_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
            log_error "Required environment variable $var is not set in .env file"
            exit 1
        fi
    done
    
    log_success "Environment validation completed"
}

# Build and start services
deploy_services() {
    log_info "Building and starting services..."
    
    # Stop existing services
    log_info "Stopping existing services..."
    docker-compose down --remove-orphans || true
    
    # Build new images
    log_info "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    log_info "Starting services..."
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose --profile production up -d
    else
        docker-compose up -d
    fi
    
    log_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    # Wait for MongoDB
    log_info "Waiting for MongoDB..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            log_success "MongoDB is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "MongoDB failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for backend
    log_info "Waiting for backend service..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:4000/health &> /dev/null; then
            log_success "Backend service is ready"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_error "Backend service failed to start within 60 seconds"
        exit 1
    fi
    
    log_success "All services are healthy"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Check API endpoints
    endpoints=(
        "http://localhost:4000/health"
        "http://localhost:4000/api"
        "http://localhost:4000/api/v1/vault/state"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "$endpoint" &> /dev/null; then
            log_success "✓ $endpoint"
        else
            log_error "✗ $endpoint"
        fi
    done
    
    # Check Docker containers
    log_info "Checking container status..."
    docker-compose ps
    
    log_success "Health checks completed"
}

# Show deployment summary
show_summary() {
    log_info "Deployment Summary"
    echo "===================="
    echo "Environment: $ENVIRONMENT"
    echo "Project: $PROJECT_NAME"
    echo "Services:"
    echo "  - Backend API: http://localhost:4000"
    echo "  - MongoDB: localhost:27017"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "  - Nginx Proxy: http://localhost:80"
    fi
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart: docker-compose restart"
    echo "  Shell access: docker-compose exec backend sh"
    echo ""
    echo "API Documentation:"
    echo "  Postman Collection: docs/postman_collection.json"
    echo "  API Info: http://localhost:4000/api"
    echo ""
    log_success "Deployment completed successfully! 🎉"
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "Deployment failed. Cleaning up..."
        docker-compose down --remove-orphans || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment flow
main() {
    echo "🏗️  PlexiX Backend Deployment"
    echo "=============================="
    
    check_prerequisites
    validate_env
    deploy_services
    wait_for_services
    run_health_checks
    show_summary
}

# Run main function
main "$@"
