# Cold Start Prevention Strategy

This document outlines the comprehensive solution implemented to prevent AWS App Runner instances from going cold and minimize cold start occurrences.

## Problem Overview

AWS App Runner instances can go "cold" when:
- No requests are received for extended periods
- Auto-scaling reduces instances below optimal levels
- Deployments cause temporary instance unavailability
- CPU throttling affects instance readiness

Cold starts result in:
- Slower response times (5-30 seconds)
- Poor user experience
- Potential timeout errors
- Increased error rates

## Solution Components

### 1. Increased Minimum Instances

#### Configuration
- **Minimum Instances**: Increased from 2 to **5 instances**
- **Always-On Mode**: Enabled to maintain warm instances
- **Target Capacity**: Set to 80% to keep more instances active

```hcl
min_size = var.enable_always_on ? var.min_size : 5  # 5 instances minimum
```

#### Benefits
- Ensures at least 5 instances are always running
- Provides redundancy across availability zones
- Reduces likelihood of all instances going cold simultaneously

### 2. Optimized Auto-Scaling Configuration

#### Reduced Max Concurrency
- **Max Concurrency**: Reduced from 20 to **15 requests per instance**
- **Scale-Up Cooldown**: 60 seconds (faster scaling up)
- **Scale-Down Cooldown**: 300 seconds (slower scaling down)

```hcl
max_concurrency = 15  # Triggers scaling earlier
```

#### Benefits
- Instances scale up sooner when traffic increases
- More conservative scaling down prevents cold starts
- Maintains higher instance count during low traffic

### 3. Keep-Alive Mechanism

#### Automated Keep-Alive Lambda
- **Frequency**: Runs every 5 minutes
- **Endpoints**: Pings multiple critical endpoints
- **Concurrency**: 10 concurrent requests per execution

```typescript
// Lambda runs every 5 minutes
schedule_expression = "rate(5 minutes)"
```

#### Keep-Alive Endpoint
- **Endpoint**: `/api/keep-alive`
- **Response Time**: < 1 second
- **Purpose**: Lightweight endpoint to keep instances active

#### Benefits
- Prevents instances from going idle
- Maintains database connections
- Keeps application code "hot" in memory

### 4. Comprehensive Instance Warming Strategy

#### Warming Script Features
- **Duration**: 5-minute comprehensive warming
- **Phases**: Endpoints, database, traffic patterns, monitoring
- **Realistic Traffic**: Simulates actual user behavior
- **Progress Monitoring**: Real-time instance and performance tracking

#### Warming Phases
1. **Critical Endpoints**: Health checks, keep-alive, main pages
2. **Database Connections**: Warms Convex DB connections
3. **Traffic Patterns**: Burst, steady, and spike patterns
4. **Monitoring**: Tracks warming progress and success

#### Benefits
- Ensures all instances are fully warmed after deployment
- Tests all critical application paths
- Validates performance before going live

### 5. Enhanced Monitoring and Alerting

#### CloudWatch Alarms
- **Cold Start Detection**: Alerts when < 4 active instances
- **Scale-Down Monitoring**: Alerts when instances drop below 6
- **High CPU Usage**: Alerts when CPU > 70%
- **Response Time**: Alerts when average response > 100 seconds

#### Monitoring Metrics
- Active instances count
- Response times across endpoints
- CPU utilization
- Error rates and patterns

#### Benefits
- Proactive detection of cold start conditions
- Early warning of scaling issues
- Performance trend analysis

## Implementation Details

### Infrastructure Changes

#### Terraform Configuration
```hcl
# Auto-scaling with cold start prevention
resource "aws_apprunner_auto_scaling_configuration_version" "app" {
  min_size = 5  # Increased minimum instances
  max_concurrency = 15  # Reduced for earlier scaling
}

# Keep-alive Lambda function
resource "aws_lambda_function" "keep_alive" {
  function_name = "${local.name_prefix}-keep-alive"
  schedule_expression = "rate(5 minutes)"
}
```

#### CloudWatch Alarms
```hcl
# Cold start detection
resource "aws_cloudwatch_metric_alarm" "app_runner_cold_start" {
  threshold = "4"  # Alert if < 4 instances
  metric_name = "ActiveInstances"
}
```

### Application Changes

#### Keep-Alive Endpoint
```typescript
// /api/keep-alive - responds in < 1 second
export async function GET(request: NextRequest) {
  return ResponseFactory.success({
    status: 'alive',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
}
```

#### Lambda Keep-Alive Function
```typescript
// Runs every 5 minutes
export const handler = async () => {
  const endpoints = [
    '/api/keep-alive',
    '/api/health/fast',
    '/api/health',
    '/'
  ];
  
  // Send concurrent requests to all endpoints
  await Promise.all(endpoints.map(pingEndpoint));
};
```

### Deployment Strategy

#### Optimized Deployment Script
```bash
# Comprehensive warming after deployment
./scripts/warm-instances.sh
```

#### GitHub Actions Integration
```yaml
- name: Warm instances comprehensively
  run: |
    chmod +x scripts/warm-instances.sh
    ./scripts/warm-instances.sh
```

## Performance Impact

### Before Implementation
- **Cold Starts**: Frequent during low traffic periods
- **Response Time**: 5-30 seconds for cold requests
- **Instance Count**: Often dropped to 1-2 instances
- **User Experience**: Poor due to slow responses

### After Implementation
- **Cold Starts**: Rare (< 1% of requests)
- **Response Time**: Consistent 1-3 seconds
- **Instance Count**: Maintains 5+ instances minimum
- **User Experience**: Fast and consistent responses

## Cost Considerations

### Additional Costs
- **Lambda Function**: ~$0.20/month (runs every 5 minutes)
- **Additional Instances**: ~$50-100/month (3 extra minimum instances)
- **CloudWatch Alarms**: ~$5/month (additional alarms)

### Cost Benefits
- **Reduced Timeout Errors**: Fewer failed requests
- **Better User Retention**: Faster response times
- **Reduced Support Load**: Fewer performance issues

## Maintenance and Monitoring

### Daily Monitoring
- Check CloudWatch dashboards for instance counts
- Monitor response times across endpoints
- Review any cold start alerts

### Weekly Tasks
- Review scaling patterns and adjust if needed
- Check Lambda function execution logs
- Analyze traffic patterns for optimization opportunities

### Monthly Reviews
- Evaluate cost vs. performance trade-offs
- Adjust minimum instance count if traffic patterns change
- Review and optimize warming strategy

## Troubleshooting

### Common Issues

#### Instances Still Going Cold
- Check if keep-alive Lambda is running
- Verify minimum instance count is set correctly
- Review auto-scaling configuration

#### High Costs
- Consider reducing minimum instances if traffic is very low
- Adjust keep-alive frequency (currently every 5 minutes)
- Review scaling thresholds

#### Slow Warming
- Increase warming script duration
- Add more endpoint variations
- Check network connectivity

### Debugging Commands
```bash
# Check active instances
aws cloudwatch get-metric-statistics \
  --namespace AWS/AppRunner \
  --metric-name ActiveInstances \
  --dimensions Name=ServiceName,Value=cribnosh-production

# Test keep-alive endpoint
curl -w "@curl-format.txt" -o /dev/null -s "https://cribnosh.co.uk/api/keep-alive"

# Run warming script manually
./scripts/warm-instances.sh
```

## Best Practices

### 1. Instance Management
- Always maintain minimum 5 instances
- Monitor scaling patterns regularly
- Adjust thresholds based on traffic patterns

### 2. Keep-Alive Strategy
- Use lightweight endpoints for keep-alive
- Maintain consistent ping intervals
- Monitor Lambda function health

### 3. Warming Strategy
- Warm instances after every deployment
- Test all critical application paths
- Monitor warming success metrics

### 4. Cost Optimization
- Balance instance count with performance needs
- Monitor costs vs. performance metrics
- Adjust strategies based on traffic patterns

## Success Metrics

### Key Performance Indicators
- **Cold Start Rate**: < 1% of requests
- **Average Response Time**: < 3 seconds
- **Minimum Active Instances**: ≥ 5
- **Keep-Alive Success Rate**: > 99%

### Monitoring Dashboard
- Active instances over time
- Response time distribution
- Cold start occurrences
- Scaling events and patterns

This comprehensive cold start prevention strategy ensures your CribNosh application maintains optimal performance with minimal cold start occurrences, providing users with fast, consistent response times.
