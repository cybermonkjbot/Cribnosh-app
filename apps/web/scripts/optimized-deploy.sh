#!/bin/bash

# AWS App Runner Deployment Optimization Script
# This script optimizes deployments to prevent cold starts and timeout issues

set -e

# Configuration
SERVICE_NAME="cribnosh-production"
REGION="eu-west-2"
MIN_INSTANCES=2
MAX_INSTANCES=20
MAX_CONCURRENCY=20

echo "🚀 Starting optimized deployment for $SERVICE_NAME..."

# Function to check if App Runner service is healthy
check_service_health() {
    local service_arn=$1
    local max_attempts=90  # Increased to 15 minutes (90 * 10s)
    local attempt=1
    
    echo "🔍 Monitoring health for service: $service_arn"
    
    while [ $attempt -le $max_attempts ]; do
        local status=$(aws apprunner describe-service \
            --service-arn "$service_arn" \
            --query 'Service.Status' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        if [ "$status" = "RUNNING" ]; then
            echo "✅ Service is healthy and running"
            return 0
        elif [ "$status" = "RUNNING_FAILED" ]; then
            echo "❌ Service failed to start (RUNNING_FAILED)"
            return 1
        elif [ "$status" = "OPERATION_IN_PROGRESS" ]; then
            echo "⏳ Service status: $status (attempt $attempt/$max_attempts) - Deployment still in progress..."
            sleep 10
            ((attempt++))
        else
            echo "⏳ Service status: $status (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        fi
    done
    
    echo "❌ Service health check timed out after $((max_attempts * 10 / 60)) minutes"
    return 1
}

# Function to perform rolling deployment
rolling_deployment() {
    echo "🔄 Starting rolling deployment..."
    
    # Get current service configuration
    local service_arn=$(aws apprunner list-services \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
        --output text)
    
    if [ -z "$service_arn" ]; then
        echo "❌ Service not found: $SERVICE_NAME"
        exit 1
    fi
    
    # Start deployment
    echo "🚀 Starting new deployment..."
    aws apprunner start-deployment --service-arn "$service_arn"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to start deployment"
        return 1
    fi
    
    echo "✅ Deployment initiated successfully"
    return 0
}

# Main deployment process
main() {
    echo "🎯 AWS App Runner Optimized Deployment"
    echo "======================================"
    
    # Check prerequisites
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    # Get service URL
    local service_url=$(aws apprunner list-services \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceUrl" \
        --output text)
    
    if [ -z "$service_url" ]; then
        echo "❌ Service not found: $SERVICE_NAME"
        exit 1
    fi
    
    echo "🌐 Service URL: $service_url"
    
    # Perform rolling deployment
    rolling_deployment
    
    # Get the service ARN for health check
    local service_arn=$(aws apprunner list-services \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
        --output text)
    
    # Check service health
    if ! check_service_health "$service_arn"; then
        echo "❌ Service health check failed"
        exit 1
    fi
    
    echo "🎉 Optimized deployment completed successfully!"
    echo "📊 Service is now running with optimized configuration:"
    echo "   - Minimum instances: $MIN_INSTANCES"
    echo "   - Maximum instances: $MAX_INSTANCES"
    echo "   - Max concurrency: $MAX_CONCURRENCY"
}

# Run main function
main "$@"
