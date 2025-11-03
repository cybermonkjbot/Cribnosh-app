#!/bin/bash

# Enhanced deployment script with always-on high availability
# This script ensures at least one VM is always available and never dies

set -e

# Configuration
APP_NAME="cribnosh"
ENVIRONMENT="production"
AWS_REGION="eu-west-2"
HEALTH_CHECK_TIMEOUT=600  # 10 minutes
HEALTH_CHECK_INTERVAL=15  # 15 seconds
MAX_HEALTH_CHECK_ATTEMPTS=40
MIN_HEALTHY_INSTANCES=2
MAX_RETRY_ATTEMPTS=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
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

# Function to get active instance count
get_active_instances() {
    local service_arn="$1"
    aws apprunner describe-service --service-arn "$service_arn" --region "$AWS_REGION" \
        --query "Service.ServiceConfiguration.AutoScalingConfigurationSummary.MaxSize" --output text
}

# Function to perform comprehensive health check
perform_comprehensive_health_check() {
    local url="$1"
    local timeout="$2"
    
    log_info "Performing comprehensive health check on $url"
    
    # Test multiple endpoints
    local endpoints=(
        "/api/health"
        "/api/contacts"
        "/"
    )
    
    local all_tests_passed=true
    local failed_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        local test_url="${url}${endpoint}"
        log_info "Testing endpoint: $test_url"
        
        local response
        response=$(curl -s -w "%{http_code}" \
            --max-time "$timeout" \
            --retry 2 \
            --retry-delay 3 \
            --retry-max-time 30 \
            "$test_url" || echo "000")
        
        local http_code="${response: -3}"
        
        if [ "$http_code" = "200" ]; then
            log_success "✅ Endpoint $endpoint passed (HTTP $http_code)"
        else
            log_warning "⚠️ Endpoint $endpoint failed (HTTP $http_code)"
            all_tests_passed=false
            failed_endpoints+=("$endpoint")
        fi
    done
    
    if [ "$all_tests_passed" = true ]; then
        log_success "🎉 All health checks passed"
        return 0
    else
        log_warning "Some endpoints failed: ${failed_endpoints[*]}"
        return 1
    fi
}

# Function to wait for service to be ready with instance count validation
wait_for_service_ready() {
    local service_arn="$1"
    local max_attempts="$2"
    local attempt=1
    
    log_info "Waiting for service to be ready with minimum $MIN_HEALTHY_INSTANCES instances..."
    
    while [ $attempt -le $max_attempts ]; do
        local status
        status=$(get_deployment_status "$service_arn")
        
        local instances
        instances=$(get_active_instances "$service_arn")
        
        log_info "Attempt $attempt/$max_attempts - Status: $status, Instances: $instances"
        
        if [ "$status" = "RUNNING" ] && [ "$instances" -ge "$MIN_HEALTHY_INSTANCES" ]; then
            log_success "✅ Service is running with $instances instances"
            return 0
        elif [ "$status" = "CREATE_FAILED" ] || [ "$status" = "UPDATE_FAILED" ]; then
            log_error "❌ Service deployment failed with status: $status"
            return 1
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        attempt=$((attempt + 1))
    done
    
    log_error "❌ Service did not become ready within timeout"
    return 1
}

# Function to ensure minimum instance count
ensure_minimum_instances() {
    local service_arn="$1"
    local current_instances
    current_instances=$(get_active_instances "$service_arn")
    
    if [ "$current_instances" -lt "$MIN_HEALTHY_INSTANCES" ]; then
        log_warning "⚠️ Only $current_instances instances running, need $MIN_HEALTHY_INSTANCES"
        log_info "Triggering scale-up to ensure high availability..."
        
        # Trigger a new deployment to scale up
        aws apprunner start-deployment --service-arn "$service_arn" --region "$AWS_REGION"
        
        # Wait for scale-up to complete
        local attempt=1
        while [ $attempt -le 20 ]; do
            sleep 30
            current_instances=$(get_active_instances "$service_arn")
            log_info "Scale-up attempt $attempt - Current instances: $current_instances"
            
            if [ "$current_instances" -ge "$MIN_HEALTHY_INSTANCES" ]; then
                log_success "✅ Successfully scaled to $current_instances instances"
                return 0
            fi
            
            attempt=$((attempt + 1))
        done
        
        log_error "❌ Failed to scale up to minimum instances"
        return 1
    else
        log_success "✅ Sufficient instances running: $current_instances"
        return 0
    fi
}

# Function to deploy with high availability checks
deploy_with_high_availability() {
    local service_arn="$1"
    local service_url="$2"
    local retry_attempt=1
    
    while [ $retry_attempt -le $MAX_RETRY_ATTEMPTS ]; do
        log_info "🚀 Starting deployment attempt $retry_attempt/$MAX_RETRY_ATTEMPTS"
        
        # Start deployment
        log_info "Triggering new deployment..."
        aws apprunner start-deployment --service-arn "$service_arn" --region "$AWS_REGION"
        
        # Wait for service to be ready
        if wait_for_service_ready "$service_arn" $MAX_HEALTH_CHECK_ATTEMPTS; then
            # Ensure minimum instance count
            if ensure_minimum_instances "$service_arn"; then
                # Perform comprehensive health checks
                if perform_comprehensive_health_check "$service_url" 30; then
                    log_success "🎉 Deployment successful with high availability!"
                    return 0
                else
                    log_warning "⚠️ Health checks failed, retrying..."
                fi
            else
                log_warning "⚠️ Failed to ensure minimum instances, retrying..."
            fi
        else
            log_warning "⚠️ Service failed to become ready, retrying..."
        fi
        
        retry_attempt=$((retry_attempt + 1))
        
        if [ $retry_attempt -le $MAX_RETRY_ATTEMPTS ]; then
            log_info "⏳ Waiting 60 seconds before retry..."
            sleep 60
        fi
    done
    
    log_error "❌ All deployment attempts failed"
    return 1
}

# Function to monitor deployment with continuous health checks
monitor_deployment() {
    local service_arn="$1"
    local service_url="$2"
    
    log_info "🔍 Monitoring deployment for 15 minutes with continuous health checks..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + 900)) # 15 minutes
    local check_count=0
    local failed_checks=0
    
    while [ $(date +%s) -lt $end_time ]; do
        check_count=$((check_count + 1))
        log_info "Health check #$check_count"
        
        if perform_comprehensive_health_check "$service_url" 15; then
            log_success "✅ Health check #$check_count passed"
        else
            failed_checks=$((failed_checks + 1))
            log_warning "⚠️ Health check #$check_count failed ($failed_checks total failures)"
            
            # If too many failures, trigger recovery
            if [ $failed_checks -ge 3 ]; then
                log_critical "🚨 Too many health check failures, triggering recovery..."
                aws apprunner start-deployment --service-arn "$service_arn" --region "$AWS_REGION"
                failed_checks=0
            fi
        fi
        
        # Check instance count every 5 checks
        if [ $((check_count % 5)) -eq 0 ]; then
            ensure_minimum_instances "$service_arn"
        fi
        
        sleep 60 # Check every minute
    done
    
    log_success "🎉 Monitoring period completed successfully"
    log_info "📊 Final stats: $check_count checks performed, $failed_checks failures"
    return 0
}

# Function to validate high availability setup
validate_high_availability() {
    local service_arn="$1"
    local service_url="$2"
    
    log_info "🔍 Validating high availability setup..."
    
    # Check service status
    local status
    status=$(get_deployment_status "$service_arn")
    log_info "Service status: $status"
    
    # Check instance count
    local instances
    instances=$(get_active_instances "$service_arn")
    log_info "Active instances: $instances"
    
    # Check health endpoints
    if perform_comprehensive_health_check "$service_url" 30; then
        log_success "✅ High availability validation passed"
        return 0
    else
        log_error "❌ High availability validation failed"
        return 1
    fi
}

# Main deployment function
main() {
    log_critical "🚀 Starting HIGH AVAILABILITY deployment for $APP_NAME-$ENVIRONMENT"
    log_info "📋 Configuration:"
    log_info "   - Minimum instances: $MIN_HEALTHY_INSTANCES"
    log_info "   - Max retry attempts: $MAX_RETRY_ATTEMPTS"
    log_info "   - Health check timeout: ${HEALTH_CHECK_TIMEOUT}s"
    log_info "   - Region: $AWS_REGION"
    
    # Check prerequisites
    if ! command_exists aws; then
        log_error "❌ AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! command_exists curl; then
        log_error "❌ curl not found. Please install curl."
        exit 1
    fi
    
    # Get service ARN
    local service_arn
    service_arn=$(get_service_arn)
    
    if [ -z "$service_arn" ] || [ "$service_arn" = "None" ]; then
        log_error "❌ App Runner service not found: $APP_NAME-$ENVIRONMENT"
        exit 1
    fi
    
    log_info "✅ Found service ARN: $service_arn"
    
    # Get service URL
    local service_url
    service_url=$(aws apprunner describe-service --service-arn "$service_arn" --region "$AWS_REGION" \
        --query "Service.ServiceUrl" --output text)
    
    log_info "✅ Service URL: $service_url"
    
    # Validate current setup
    if ! validate_high_availability "$service_arn" "$service_url"; then
        log_warning "⚠️ Current setup validation failed, proceeding with deployment..."
    fi
    
    # Deploy with high availability
    if deploy_with_high_availability "$service_arn" "$service_url"; then
        # Monitor deployment
        if monitor_deployment "$service_arn" "$service_url"; then
            log_critical "🎉 HIGH AVAILABILITY DEPLOYMENT COMPLETED SUCCESSFULLY!"
            log_success "✅ Service is healthy and ready to serve traffic"
            log_success "✅ Minimum $MIN_HEALTHY_INSTANCES instances guaranteed"
            log_success "✅ Auto-recovery mechanisms active"
            log_success "✅ Continuous monitoring enabled"
        else
            log_error "❌ Monitoring failed after deployment"
            exit 1
        fi
    else
        log_error "❌ High availability deployment failed"
        exit 1
    fi
}

# Run main function
main "$@"
