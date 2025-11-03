#!/bin/bash

# Enhanced deployment script with health checks and rollback capabilities
# This script addresses NetworkError issues by ensuring proper deployment validation

set -e

# Configuration
APP_NAME="cribnosh"
ENVIRONMENT="production"
AWS_REGION="eu-west-2"
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10  # 10 seconds
MAX_HEALTH_CHECK_ATTEMPTS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get App Runner service ARN
get_service_arn() {
    local service_name="${APP_NAME}-${ENVIRONMENT}"
    aws apprunner list-services --region "$AWS_REGION" \
        --query "ServiceSummaryList[?ServiceName=='$service_name'].ServiceArn" \
        --output text
}

# Function to get current deployment status
get_deployment_status() {
    local service_arn="$1"
    aws apprunner describe-service --service-arn "$service_arn" --region "$AWS_REGION" \
        --query "Service.Status" --output text
}

# Function to perform health check
perform_health_check() {
    local url="$1"
    local timeout="$2"
    
    log_info "Performing health check on $url"
    
    # Use curl with timeout and retry logic
    local response
    response=$(curl -s -w "%{http_code}" \
        --max-time "$timeout" \
        --retry 3 \
        --retry-delay 2 \
        --retry-max-time 30 \
        "$url/api/health" || echo "000")
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        log_success "Health check passed (HTTP $http_code)"
        return 0
    else
        log_error "Health check failed (HTTP $http_code)"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service_ready() {
    local service_arn="$1"
    local max_attempts="$2"
    local attempt=1
    
    log_info "Waiting for service to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        local status
        status=$(get_deployment_status "$service_arn")
        
        log_info "Attempt $attempt/$max_attempts - Service status: $status"
        
        if [ "$status" = "RUNNING" ]; then
            log_success "Service is running"
            return 0
        elif [ "$status" = "CREATE_FAILED" ] || [ "$status" = "UPDATE_FAILED" ]; then
            log_error "Service deployment failed with status: $status"
            return 1
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        attempt=$((attempt + 1))
    done
    
    log_error "Service did not become ready within timeout"
    return 1
}

# Function to perform comprehensive health checks
perform_comprehensive_health_checks() {
    local service_url="$1"
    local max_attempts="$2"
    local attempt=1
    
    log_info "Performing comprehensive health checks..."
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts"
        
        if perform_health_check "$service_url" 30; then
            # Additional checks for network connectivity
            log_info "Performing additional connectivity tests..."
            
            # Test API endpoints
            local api_tests=(
                "/api/health"
                "/api/contacts"
            )
            
            local all_tests_passed=true
            for endpoint in "${api_tests[@]}"; do
                local test_url="${service_url}${endpoint}"
                log_info "Testing endpoint: $test_url"
                
                if ! curl -s --max-time 10 --retry 2 "$test_url" >/dev/null; then
                    log_warning "Endpoint test failed: $test_url"
                    all_tests_passed=false
                fi
            done
            
            if [ "$all_tests_passed" = true ]; then
                log_success "All health checks passed"
                return 0
            else
                log_warning "Some endpoint tests failed, retrying..."
            fi
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        attempt=$((attempt + 1))
    done
    
    log_error "Health checks failed after $max_attempts attempts"
    return 1
}

# Function to rollback deployment
rollback_deployment() {
    local service_arn="$1"
    
    log_warning "Initiating rollback..."
    
    # Get previous deployment ID
    local previous_deployment
    previous_deployment=$(aws apprunner list-operations --service-arn "$service_arn" --region "$AWS_REGION" \
        --query "OperationSummaryList[1].OperationId" --output text)
    
    if [ "$previous_deployment" != "None" ] && [ "$previous_deployment" != "" ]; then
        log_info "Rolling back to deployment: $previous_deployment"
        
        # Start rollback operation
        aws apprunner start-deployment --service-arn "$service_arn" --region "$AWS_REGION"
        
        # Wait for rollback to complete
        wait_for_service_ready "$service_arn" $MAX_HEALTH_CHECK_ATTEMPTS
        
        log_success "Rollback completed"
    else
        log_error "No previous deployment found for rollback"
        return 1
    fi
}

# Function to deploy with health checks
deploy_with_health_checks() {
    local service_arn="$1"
    local service_url="$2"
    
    log_info "Starting deployment with health checks..."
    
    # Start deployment
    log_info "Triggering new deployment..."
    aws apprunner start-deployment --service-arn "$service_arn" --region "$AWS_REGION"
    
    # Wait for service to be ready
    if ! wait_for_service_ready "$service_arn" $MAX_HEALTH_CHECK_ATTEMPTS; then
        log_error "Service failed to become ready"
        return 1
    fi
    
    # Perform comprehensive health checks
    if ! perform_comprehensive_health_checks "$service_url" $MAX_HEALTH_CHECK_ATTEMPTS; then
        log_error "Health checks failed, initiating rollback..."
        rollback_deployment "$service_arn"
        return 1
    fi
    
    log_success "Deployment completed successfully with all health checks passing"
    return 0
}

# Function to monitor deployment
monitor_deployment() {
    local service_arn="$1"
    local service_url="$2"
    
    log_info "Monitoring deployment for 10 minutes..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + 600)) # 10 minutes
    
    while [ $(date +%s) -lt $end_time ]; do
        if ! perform_health_check "$service_url" 10; then
            log_error "Health check failed during monitoring period"
            return 1
        fi
        
        log_info "Health check passed, continuing monitoring..."
        sleep 60 # Check every minute
    done
    
    log_success "Monitoring period completed successfully"
    return 0
}

# Main deployment function
main() {
    log_info "Starting enhanced deployment for $APP_NAME-$ENVIRONMENT"
    
    # Check prerequisites
    if ! command_exists aws; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! command_exists curl; then
        log_error "curl not found. Please install curl."
        exit 1
    fi
    
    # Get service ARN
    local service_arn
    service_arn=$(get_service_arn)
    
    if [ -z "$service_arn" ] || [ "$service_arn" = "None" ]; then
        log_error "App Runner service not found: $APP_NAME-$ENVIRONMENT"
        exit 1
    fi
    
    log_info "Found service ARN: $service_arn"
    
    # Get service URL
    local service_url
    service_url=$(aws apprunner describe-service --service-arn "$service_arn" --region "$AWS_REGION" \
        --query "Service.ServiceUrl" --output text)
    
    log_info "Service URL: $service_url"
    
    # Perform pre-deployment health check
    log_info "Performing pre-deployment health check..."
    if ! perform_health_check "$service_url" 30; then
        log_warning "Pre-deployment health check failed, but continuing with deployment..."
    fi
    
    # Deploy with health checks
    if deploy_with_health_checks "$service_arn" "$service_url"; then
        # Monitor deployment
        if monitor_deployment "$service_arn" "$service_url"; then
            log_success "Deployment completed successfully!"
            log_info "Service is healthy and ready to serve traffic"
        else
            log_error "Monitoring failed after deployment"
            exit 1
        fi
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Run main function
main "$@"
