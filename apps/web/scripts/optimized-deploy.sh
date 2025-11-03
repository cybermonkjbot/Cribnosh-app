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

# Function to warm up instances
warm_up_instances() {
    local service_url=$1
    local warm_up_requests=5
    
    echo "🔥 Warming up instances..."
    
    for i in $(seq 1 $warm_up_requests); do
        echo "📡 Sending warm-up request $i/$warm_up_requests..."
        
        # Send requests to different endpoints to warm up various parts of the app
        curl -s -o /dev/null "$service_url/api/health/fast" &
        curl -s -o /dev/null "$service_url/api/health" &
        curl -s -o /dev/null "$service_url/" &
        
        # Wait a bit between requests
        sleep 2
    done
    
    # Wait for all background requests to complete
    wait
    
    echo "✅ Instance warm-up completed"
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
    local operation_id=$(aws apprunner start-deployment \
        --service-arn "$service_arn" \
        --query 'OperationId' \
        --output text)
    
    echo "📋 Operation ID: $operation_id"
    
    # Wait for deployment to complete using polling
    echo "⏳ Waiting for deployment to complete..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local operation_status=$(aws apprunner describe-operation \
            --operation-id "$operation_id" \
            --query 'Operation.Status' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        if [ "$operation_status" = "SUCCEEDED" ]; then
            echo "✅ Deployment completed successfully"
            return 0
        elif [ "$operation_status" = "FAILED" ]; then
            echo "❌ Deployment failed"
            return 1
        else
            echo "⏳ Deployment status: $operation_status (attempt $attempt/$max_attempts)"
            sleep 30
            ((attempt++))
        fi
    done
    
    echo "❌ Deployment wait timed out"
    return 1
}

# Function to monitor deployment metrics
monitor_deployment() {
    local service_name=$1
    local duration_minutes=10
    
    echo "📊 Monitoring deployment metrics for $duration_minutes minutes..."
    
    local end_time=$(date -d "+$duration_minutes minutes" +%s)
    
    while [ $(date +%s) -lt $end_time ]; do
        # Get service metrics
        local active_instances=$(aws cloudwatch get-metric-statistics \
            --namespace "AWS/AppRunner" \
            --metric-name "ActiveInstances" \
            --dimensions Name=ServiceName,Value="$service_name" \
            --start-time $(date -d "5 minutes ago" -u +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 300 \
            --statistics Average \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        local error_count=$(aws cloudwatch get-metric-statistics \
            --namespace "AWS/AppRunner" \
            --metric-name "ErrorCount" \
            --dimensions Name=ServiceName,Value="$service_name" \
            --start-time $(date -d "5 minutes ago" -u +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 300 \
            --statistics Sum \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "0")
        
        echo "📈 Active Instances: $active_instances, Errors (5min): $error_count"
        
        # Check for high error rate
        if [ "$error_count" != "None" ] && [ "$error_count" -gt 10 ]; then
            echo "⚠️  High error rate detected: $error_count errors in 5 minutes"
        fi
        
        sleep 60
    done
    
    echo "✅ Monitoring completed"
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
    
    # Warm up instances with comprehensive strategy
    echo "🔥 Starting comprehensive instance warming..."
    ./scripts/warm-instances.sh
    
    # Monitor deployment
    monitor_deployment "$SERVICE_NAME"
    
    echo "🎉 Optimized deployment completed successfully!"
    echo "📊 Service is now running with optimized configuration:"
    echo "   - Minimum instances: $MIN_INSTANCES"
    echo "   - Maximum instances: $MAX_INSTANCES"
    echo "   - Max concurrency: $MAX_CONCURRENCY"
    echo "   - Cold start prevention: Enabled"
}

# Run main function
main "$@"
