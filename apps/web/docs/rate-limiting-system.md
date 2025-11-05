# Rate Limiting System Documentation

## Overview

The CribNosh application implements a comprehensive rate limiting system to prevent abuse and ensure fair usage of API endpoints. The system includes multiple rate limiters for different types of operations, with environment-aware limits for development and production.

## Rate Limiting Architecture

### 1. OTP Rate Limiting System (`lib/rate-limiting.ts`)

**Purpose**: Controls one-time password generation and verification requests.

| Rate Limiter | Window | Development | Production | Purpose |
|--------------|--------|-------------|------------|---------|
| `otpRateLimiter` | 15 minutes | 100 requests | 250 requests | OTP generation |
| `verificationRateLimiter` | 5 minutes | 200 requests | 1000 requests | OTP verification |
| `generalAuthRateLimiter` | 1 minute | 100 requests | 250 requests | General auth operations |

### 2. SMS Rate Limiting System (`lib/sms/sms-config.ts`)

**Purpose**: Controls SMS and email OTP sending to prevent spam.

| Type | Window | Development | Production | Purpose |
|------|--------|-------------|------------|---------|
| Phone OTPs | 1 hour | 50 requests | 4 requests | SMS OTP sending |
| Email OTPs | 1 hour | 30 requests | 4 requests | Email OTP sending |

### 3. Sensitive Middleware System (`lib/middleware/sensitive-rate-limit.ts`)

**Purpose**: Provides stricter rate limiting for sensitive operations.

| Rate Limiter | Window | Development | Production | Purpose |
|--------------|--------|-------------|------------|---------|
| `authRateLimiter` | 5 minutes | 200 requests | 125 requests | Authentication operations |
| `sensitiveRateLimiter` | 1 minute | 100 requests | 50 requests | Sensitive operations |
| `moderationRateLimiter` | 1 minute | 100 requests | 100 requests | Content moderation |

### 4. API Middleware System (`lib/middleware/rate-limit.ts`)

**Purpose**: General API request rate limiting.

| Rate Limiter | Window | Development | Production | Purpose |
|--------------|--------|-------------|------------|---------|
| `apiRateLimiter` | 15 minutes | 2000 requests | 4000 requests | General API requests |
| `authRateLimiter` | 15 minutes | 300 requests | 300 requests | Auth middleware |
| `webhookRateLimiter` | 1 minute | 50 requests | 50 requests | Webhook endpoints |
| `searchRateLimiter` | 1 minute | 150 requests | 150 requests | Search operations |

## Rate Limiting Implementation

### In-Memory Storage
- All rate limiters use in-memory storage for fast access
- Automatic cleanup of expired entries every 5 minutes
- Environment-aware limits based on `NODE_ENV`

### Client Identification
- Primary identifier: Client IP address
- Fallback: Request headers (`x-forwarded-for`, `cf-connecting-ip`)
- Unique keys per rate limiter with prefixes

### Error Responses
When rate limits are exceeded, the system returns:
```json
{
  "error": "Too many requests",
  "retryAfter": 555,
  "requestId": "req_1759829690772_izhkmp98d"
}
```

## Testing and Development

### Reset Rate Limits Endpoint

**Endpoint**: `POST /api/test/reset-rate-limits`

**Purpose**: Resets all rate limiting counters for testing and development.

**Availability**: Only in development and test environments

**Swagger Documentation**: Available with comprehensive inline annotations

#### Usage Examples

```bash
# Reset all rate limits
curl -X POST http://localhost:3000/api/test/reset-rate-limits

# Check current configuration
curl http://localhost:3000/api/test/reset-rate-limits
```

#### Response Format

**Success Response (200)**:
```json
{
  "success": true,
  "message": "All rate limits have been reset",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "resetLimiters": [
    "otpRateLimiter",
    "verificationRateLimiter",
    "generalAuthRateLimiter",
    "authRateLimiter (sensitive)",
    "sensitiveRateLimiter",
    "moderationRateLimiter",
    "apiRateLimiter",
    "authRateLimiter (middleware)",
    "webhookRateLimiter",
    "searchRateLimiter"
  ]
}
```

**Configuration Response (200)**:
```json
{
  "message": "Rate limit reset endpoint",
  "usage": "POST to /api/test/reset-rate-limits to reset all rate limits",
  "environment": "development",
  "currentLimits": {
    "otp": {
      "windowMs": 900000,
      "maxRequests": 100
    },
    "verification": {
      "windowMs": 300000,
      "maxRequests": 200
    },
    // ... other rate limiters
  }
}
```

### Test Script

**File**: `scripts/test-rate-limits.js`

**Purpose**: Automated testing of rate limiting functionality.

**Usage**:
```bash
node scripts/test-rate-limits.js
```

**Features**:
- Tests OTP rate limits (15 requests)
- Tests verification rate limits (50 requests)
- Provides detailed success/failure reporting
- Automatic rate limit reset between tests

## Environment Configuration

### Development/Test Environment
- **NODE_ENV**: `development` or `test`
- **Limits**: Very high (100-2000 requests per window)
- **Purpose**: Unrestricted testing and development

### Production Environment
- **NODE_ENV**: `production`
- **Limits**: Balanced security and usability (4-4000 requests per window)
- **Purpose**: Prevent abuse while allowing normal usage

## Rate Limiting Best Practices

### For Developers
1. **Use Reset Endpoint**: Reset rate limits during testing
2. **Monitor Limits**: Check current limits before testing
3. **Environment Awareness**: Understand dev vs prod limits
4. **Error Handling**: Implement proper retry logic with `retryAfter`

### For API Consumers
1. **Respect Limits**: Monitor response headers for rate limit info
2. **Implement Backoff**: Use exponential backoff on 429 responses
3. **Cache Responses**: Reduce API calls through caching
4. **Batch Requests**: Combine multiple operations when possible

## Monitoring and Debugging

### Rate Limit Headers
The system includes helpful headers in responses:
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when window resets
- `Retry-After`: Seconds to wait before retrying

### Logging
- Rate limit violations are logged with context
- Monitoring metrics track rate limit usage
- Error tracking includes rate limit details

### Debugging Tools
1. **Reset Endpoint**: Clear all rate limits
2. **Configuration Endpoint**: View current limits
3. **Test Script**: Automated rate limit testing
4. **Logs**: Detailed rate limiting activity

## Security Considerations

### Production Safety
- Reset endpoint disabled in production
- Conservative limits prevent abuse
- IP-based identification prevents circumvention

### Development Flexibility
- High limits allow unrestricted testing
- Easy reset functionality for development
- Environment-aware configuration

## Troubleshooting

### Common Issues

**Issue**: "Too many requests" after few API calls
**Solution**: Reset rate limits using the test endpoint

**Issue**: Rate limits not resetting
**Solution**: Check environment configuration and restart application

**Issue**: Different limits in dev vs prod
**Solution**: Verify `NODE_ENV` setting and environment detection

### Debug Steps
1. Check current environment: `curl http://localhost:3000/api/test/reset-rate-limits`
2. Reset rate limits: `curl -X POST http://localhost:3000/api/test/reset-rate-limits`
3. Run test script: `node scripts/test-rate-limits.js`
4. Check application logs for rate limiting activity

## Future Enhancements

### Planned Improvements
- Redis-based rate limiting for distributed systems
- User-based rate limiting for authenticated requests
- Dynamic rate limiting based on system load
- Rate limiting analytics and reporting

### Configuration Options
- Environment-specific configuration files
- Runtime rate limit adjustment
- Custom rate limiting rules per endpoint
- Integration with external rate limiting services
