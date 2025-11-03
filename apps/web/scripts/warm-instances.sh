#!/bin/bash

# Instance Warming Strategy Script
# This script implements a comprehensive warming strategy to prevent cold starts

set -e

# Configuration
SERVICE_NAME="cribnosh-production"
REGION="eu-west-2"
SERVICE_URL=""
WARMING_DURATION=300  # 5 minutes
REQUEST_INTERVAL=10    # 10 seconds between requests
CONCURRENT_REQUESTS=5  # Number of concurrent requests per batch

echo "🔥 Starting comprehensive instance warming strategy..."

# Function to get service URL
get_service_url() {
    SERVICE_URL=$(aws apprunner list-services \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceUrl" \
        --output text)
    
    if [ -z "$SERVICE_URL" ]; then
        echo "❌ Service not found: $SERVICE_NAME"
        exit 1
    fi
    
    echo "🌐 Service URL: $SERVICE_URL"
}

# Function to send warming requests
send_warming_requests() {
    local endpoint=$1
    local description=$2
    
    echo "📡 Warming $description..."
    
    # Send multiple concurrent requests
    for i in $(seq 1 $CONCURRENT_REQUESTS); do
        (
            curl -s -o /dev/null -w "HTTP %{http_code} - %{time_total}s\n" \
                "$SERVICE_URL$endpoint" \
                -H "User-Agent: InstanceWarmer/1.0" \
                -H "X-Warming-Request: true" &
        ) &
    done
    
    # Wait for all requests to complete
    wait
    echo "✅ $description warming completed"
}

# Function to warm specific endpoints
warm_endpoints() {
    echo "🎯 Warming critical endpoints..."
    
    # Critical endpoints that need to be warm
    local endpoints=(
        "/api/health/fast:Fast Health Check"
        "/api/health:Full Health Check"
        "/api/keep-alive:Keep Alive"
        "/:Home Page"
        "/api/async-tasks:Async Tasks"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint description <<< "$endpoint_info"
        send_warming_requests "$endpoint" "$description"
        sleep 2  # Brief pause between endpoint warming
    done
}

# Function to simulate realistic traffic patterns
simulate_traffic_patterns() {
    echo "🚦 Simulating realistic traffic patterns..."
    
    local patterns=(
        "burst:5:2"      # 5 requests every 2 seconds
        "steady:3:5"    # 3 requests every 5 seconds
        "spike:10:1"    # 10 requests every 1 second
    )
    
    for pattern in "${patterns[@]}"; do
        IFS=':' read -r type count interval <<< "$pattern"
        
        echo "📊 Running $type pattern: $count requests every ${interval}s"
        
        for i in $(seq 1 3); do  # Run each pattern 3 times
            for j in $(seq 1 $count); do
                curl -s -o /dev/null "$SERVICE_URL/api/health/fast" &
            done
            wait
            sleep $interval
        done
    done
}

# Function to warm database connections
warm_database_connections() {
    echo "🗄️ Warming database connections..."
    
    # Send requests that will trigger database connections
    local db_endpoints=(
        "/api/health"  # This checks Convex DB
    )
    
    for endpoint in "${db_endpoints[@]}"; do
        echo "📡 Warming database via $endpoint..."
        for i in $(seq 1 3); do
            curl -s -o /dev/null "$SERVICE_URL$endpoint" &
        done
        wait
        sleep 1
    done
}

# Function to monitor warming progress
monitor_warming_progress() {
    echo "📊 Monitoring warming progress..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + WARMING_DURATION))
    
    while [ $(date +%s) -lt $end_time ]; do
        # Get current active instances
        local active_instances=$(aws cloudwatch get-metric-statistics \
            --namespace "AWS/AppRunner" \
            --metric-name "ActiveInstances" \
            --dimensions Name=ServiceName,Value="$SERVICE_NAME" \
            --start-time $(date -d "5 minutes ago" -u +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 300 \
            --statistics Average \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        # Get response time
        local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL/api/health/fast")
        
        echo "📈 Active Instances: $active_instances, Response Time: ${response_time}s"
        
        sleep $REQUEST_INTERVAL
    done
}

# Function to perform comprehensive warming
comprehensive_warming() {
    echo "🚀 Starting comprehensive warming process..."
    
    local warming_phases=(
        "endpoints:Warming critical endpoints"
        "database:Warming database connections"
        "traffic:Simulating traffic patterns"
        "monitor:Monitoring warming progress"
    )
    
    for phase_info in "${warming_phases[@]}"; do
        IFS=':' read -r phase description <<< "$phase_info"
        
        echo "🔥 Phase: $description"
        
        case $phase in
            "endpoints")
                warm_endpoints
                ;;
            "database")
                warm_database_connections
                ;;
            "traffic")
                simulate_traffic_patterns
                ;;
            "monitor")
                monitor_warming_progress
                ;;
        esac
        
        echo "✅ Phase completed: $description"
        sleep 5  # Brief pause between phases
    done
}

# Function to verify warming success
verify_warming_success() {
    echo "🔍 Verifying warming success..."
    
    # Test response times
    local endpoints=("/api/health/fast" "/api/health" "/api/keep-alive")
    
    for endpoint in "${endpoints[@]}"; do
        local response_time=$(curl -s -o /dev/null -w "%{time_total}" "$SERVICE_URL$endpoint")
        echo "📊 $endpoint: ${response_time}s"
        
        # Alert if response time is too high
        if (( $(echo "$response_time > 2.0" | bc -l) )); then
            echo "⚠️  Slow response detected: $endpoint (${response_time}s)"
        fi
    done
    
    # Check active instances
    local active_instances=$(aws cloudwatch get-metric-statistics \
        --namespace "AWS/AppRunner" \
        --metric-name "ActiveInstances" \
        --dimensions Name=ServiceName,Value="$SERVICE_NAME" \
        --start-time $(date -d "5 minutes ago" -u +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 300 \
        --statistics Average \
        --query 'Datapoints[0].Average' \
        --output text 2>/dev/null || echo "0")
    
    echo "📈 Final Active Instances: $active_instances"
    
    if (( $(echo "$active_instances >= 5" | bc -l) )); then
        echo "✅ Warming successful: Sufficient instances active"
    else
        echo "⚠️  Warning: Only $active_instances instances active (minimum: 5)"
    fi
}

# Main execution
main() {
    echo "🔥 Instance Warming Strategy"
    echo "=========================="
    
    # Check prerequisites
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        echo "❌ curl not found. Please install curl."
        exit 1
    fi
    
    # Get service URL
    get_service_url
    
    # Perform comprehensive warming
    comprehensive_warming
    
    # Verify success
    verify_warming_success
    
    echo "🎉 Instance warming strategy completed successfully!"
    echo "📊 Your instances should now be warm and ready to handle traffic"
}

# Run main function
main "$@"
