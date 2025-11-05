# Redis Implementation Documentation

## Overview

This document describes the Redis implementation for CribNosh, which provides caching, rate limiting, session management, and analytics capabilities across all environments.

## Architecture

### Components

1. **RedisClient** (`lib/redis/client.ts`)
   - Low-level Redis connection management
   - Environment-specific configuration
   - Connection pooling and error handling

2. **RedisService** (`lib/redis/redis-service.ts`)
   - High-level service wrapper
   - Caching, rate limiting, session management
   - Queue operations and analytics

3. **Rate Limiting** (`lib/middleware/rate-limit.ts`)
   - API rate limiting using Redis
   - Pre-configured limiters for different endpoints
   - Graceful fallback when Redis is unavailable

4. **Health Monitoring** (`app/api/health/redis/route.ts`)
   - Redis health check endpoint
   - Metrics collection and monitoring
   - Cache management operations

## Environment Configuration

### Environment Variables

```bash
# Primary Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Alternative: Dragonfly (Redis-compatible)
DRAGONFLY_URL=redis://localhost:6380/0

# Environment-specific URLs
REDIS_DEV_URL=redis://localhost:6379/1
REDIS_TEST_URL=redis://localhost:6379/2
```

### Environment-Specific Behavior

#### Production
- **Connection**: Immediate connection on startup
- **Retries**: 5 retries per request
- **Health Checks**: Enabled
- **Fallback**: None (fails hard)

#### Development
- **Connection**: Lazy connection
- **Retries**: 3 retries per request
- **Health Checks**: Enabled
- **Fallback**: Mock client if no Redis URL

#### Test
- **Connection**: Lazy connection
- **Retries**: 2 retries per request
- **Health Checks**: Disabled (faster)
- **Fallback**: Mock client if no Redis URL

## Usage Examples

### Caching

```typescript
import { redisService } from '@/lib/redis/redis-service';

// Set cache with TTL
await redisService.setCache('user:123', userData, { ttl: 3600 });

// Get cached data
const userData = await redisService.getCache('user:123');

// Delete cache
await redisService.deleteCache('user:123');

// Clear cache by prefix
await redisService.clearCacheByPrefix('user');
```

### Rate Limiting

```typescript
import { apiRateLimiter } from '@/lib/middleware/rate-limit';

// Check if request is rate limited
const { limited, remaining, resetMs } = await apiRateLimiter.isRateLimited('user:123');

// Get rate limit info
const info = await apiRateLimiter.getRateLimitInfo('user:123');

// Reset rate limit
await apiRateLimiter.resetRateLimit('user:123');
```

### Session Management

```typescript
// Set session data
await redisService.setSession('session:abc123', { userId: '123', role: 'user' });

// Get session data
const session = await redisService.getSession('session:abc123');

// Delete session
await redisService.deleteSession('session:abc123');
```

### Queue Operations

```typescript
// Enqueue job
await redisService.enqueue('email-queue', { to: 'user@cribnosh.co.uk', template: 'welcome' });

// Dequeue job
const job = await redisService.dequeue('email-queue');
```

### Analytics

```typescript
// Increment metric
await redisService.incrementMetric('api_requests_total');

// Get metric
const requests = await redisService.getMetric('api_requests_total');
```

## API Endpoints

### Health Check

```http
GET /api/health/redis
```

**Response:**
```json
{
  "status": "healthy",
  "details": "Redis service is operational",
  "responseTime": "45ms",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metrics": {
    "cacheHits": 1250,
    "cacheMisses": 45,
    "rateLimitExceeded": 12,
    "apiRequests": 5678
  },
  "environment": "production"
}
```

### Cache Operations

```http
POST /api/health/redis
Content-Type: application/json

{
  "action": "set",
  "key": "user:123",
  "value": { "name": "John", "email": "john@cribnosh.co.uk" },
  "ttl": 3600
}
```

**Available Actions:**
- `set` - Set cache value
- `get` - Get cache value
- `delete` - Delete cache key
- `clear` - Clear cache by prefix
- `flush` - Flush all Redis data

## Rate Limiting Configuration

### Pre-configured Limiters

```typescript
// API Rate Limiter
apiRateLimiter: 800 requests per 15 minutes

// Authentication Rate Limiter
authRateLimiter: 60 requests per 15 minutes

// Webhook Rate Limiter
webhookRateLimiter: 10 requests per 1 minute

// Search Rate Limiter
searchRateLimiter: 30 requests per 1 minute
```

### Custom Rate Limiter

```typescript
import { RateLimiter } from '@/lib/middleware/rate-limit';

const customLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyPrefix: 'custom-rate-limit:',
});
```

## Monitoring and Metrics

### Health Checks

The Redis service includes comprehensive health checks:

1. **Connection Health**: Verifies Redis connection
2. **Operation Health**: Tests basic Redis operations
3. **Performance Metrics**: Response times and throughput

### Metrics Collected

- `cache_hits` - Number of cache hits
- `cache_misses` - Number of cache misses
- `rate_limit_exceeded_total` - Rate limit violations
- `api_requests_total` - Total API requests
- `redis_operations_total` - Total Redis operations

### Logging

All Redis operations are logged with appropriate levels:

- **Info**: Successful operations, health checks
- **Warning**: Rate limit exceeded, connection issues
- **Error**: Operation failures, connection errors

## Performance Optimization

### Connection Pooling

- Singleton pattern for client instances
- Lazy connection in development/test
- Connection reuse across requests

### Caching Strategies

- **TTL-based**: Automatic expiration
- **Prefix-based**: Namespaced keys
- **Bulk operations**: Clear by prefix

### Rate Limiting Algorithm

- **Sliding Window**: Using Redis sorted sets
- **Precise Timing**: Millisecond accuracy
- **Automatic Cleanup**: Expired entries removed

## Error Handling

### Graceful Degradation

- **Redis Unavailable**: Fail open for rate limiting
- **Connection Errors**: Automatic retry with backoff
- **Operation Failures**: Logged and handled gracefully

### Fallback Strategies

1. **Development/Test**: Mock client when Redis unavailable
2. **Production**: Hard failures with detailed error messages
3. **Rate Limiting**: Allow requests when Redis down

## Security Considerations

### Authentication

- Password-based authentication supported
- SSL/TLS encryption for production
- Environment-specific credentials

### Data Protection

- No sensitive data stored in cache
- Session data encrypted
- Automatic key expiration

### Access Control

- Environment-specific access
- Network-level security
- Monitoring and alerting

## Deployment

### Docker Setup

```dockerfile
# Redis service in docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
```

### Production Considerations

1. **High Availability**: Redis Cluster or Sentinel
2. **Persistence**: RDB and AOF enabled
3. **Monitoring**: Redis Exporter for Prometheus
4. **Backup**: Automated backup strategies

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check Redis server status
   - Verify connection parameters
   - Check firewall settings

2. **Memory Issues**
   - Monitor Redis memory usage
   - Set appropriate maxmemory policy
   - Implement key expiration

3. **Performance Issues**
   - Check Redis slow log
   - Monitor connection pool
   - Optimize key patterns

### Debug Commands

```bash
# Check Redis status
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check memory usage
redis-cli info memory

# Check slow queries
redis-cli slowlog get 10
```

## Testing

### Unit Tests

```typescript
import { redisService } from '@/lib/redis/redis-service';

describe('RedisService', () => {
  it('should set and get cache', async () => {
    await redisService.setCache('test', 'value');
    const result = await redisService.getCache('test');
    expect(result).toBe('value');
  });
});
```

### Integration Tests

```typescript
describe('Redis Integration', () => {
  it('should handle rate limiting', async () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 2 });
    
    const result1 = await limiter.isRateLimited('test');
    const result2 = await limiter.isRateLimited('test');
    const result3 = await limiter.isRateLimited('test');
    
    expect(result1.limited).toBe(false);
    expect(result2.limited).toBe(false);
    expect(result3.limited).toBe(true);
  });
});
```

## Migration Guide

### From Mock to Real Redis

1. **Environment Setup**: Configure Redis URLs
2. **Connection Testing**: Verify connectivity
3. **Data Migration**: No data migration needed
4. **Monitoring**: Set up health checks
5. **Testing**: Update test configurations

### Version Compatibility

- **Redis**: 6.0+ (7.0+ recommended)
- **Dragonfly**: 1.0+ (Redis-compatible)
- **ioredis**: 5.0+ (Node.js client)

## Future Enhancements

1. **Redis Cluster**: Horizontal scaling
2. **Redis Streams**: Event sourcing
3. **Redis Modules**: Custom functionality
4. **Multi-region**: Geographic distribution
5. **Advanced Analytics**: Real-time insights 