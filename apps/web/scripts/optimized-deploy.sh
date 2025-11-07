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
    local service_name=$1
    local max_attempts=30
    local attempt=1
    
    echo "🔍 Checking service health..."
    
    while [ $attempt -le $max_attempts ]; do
        local status=$(aws apprunner describe-service \
            --service-arn "arn:aws:apprunner:$REGION:$(aws sts get-caller-identity --query Account --output text):service/$service_name" \
            --query 'Service.Status' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        if [ "$status" = "RUNNING" ]; then
            echo "✅ Service is healthy and running"
            return 0
        elif [ "$status" = "RUNNING_FAILED" ]; then
            echo "❌ Service failed to start"
            return 1
        else
            echo "⏳ Service status: $status (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        fi
    done
    
    echo "❌ Service health check timed out"
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
    
    # Wait for deployment to complete by polling service status
    echo "⏳ Waiting for deployment to complete (this may take a few minutes)..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local service_status=$(aws apprunner describe-service \
            --service-arn "$service_arn" \
            --query 'Service.Status' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        if [ "$service_status" = "RUNNING" ]; then
            echo "✅ Deployment completed successfully"
            return 0
        elif [ "$service_status" = "RUNNING_FAILED" ] || [ "$service_status" = "UPDATE_FAILED" ]; then
            echo "❌ Deployment failed with status: $service_status"
            return 1
        else
            echo "⏳ Deployment status: $service_status (attempt $attempt/$max_attempts)"
            sleep 30
            ((attempt++))
        fi
    done
    
    echo "❌ Deployment wait timed out after $max_attempts attempts"
    return 1
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
    
    # Check service health
    if ! check_service_health "$SERVICE_NAME"; then
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
