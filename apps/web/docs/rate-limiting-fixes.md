# Rate Limiting Fixes for Testing

## Problem
The API endpoints were hitting rate limits too quickly during testing, preventing proper endpoint testing with the error:
```json
{
  "error": "Too many requests",
  "retryAfter": 555,
  "requestId": "req_1759829690772_izhkmp98d"
}
```

## Solution
Implemented environment-based rate limiting with much more lenient limits for development and testing environments.

## Changes Made

### 1. Updated Rate Limiting Configuration (`lib/rate-limiting.ts`)
- **OTP Rate Limiter**: Increased from 10 to 100 requests per 15 minutes in development
- **Verification Rate Limiter**: Increased from 40 to 200 requests per 5 minutes in development  
- **General Auth Rate Limiter**: Increased from 10 to 100 requests per minute in development
- Added reset functionality for testing purposes

### 2. Updated SMS Configuration (`lib/sms/sms-config.ts`)
- **Phone OTPs**: Increased from 5 to 50 per hour in development
- **Email OTPs**: Increased from 3 to 30 per hour in development
- **Cooldown**: Removed cooldown period in development (0 minutes vs 1 minute)

### 3. Added Test Utility Endpoint (`app/api/test/reset-rate-limits/route.ts`)
- **POST**: Resets all rate limits (development/test only)
- **GET**: Shows current rate limit configuration
- Only available in non-production environments

### 4. Added Test Script (`scripts/test-rate-limits.js`)
- Automated testing of rate limit fixes
- Tests both OTP and verification endpoints
- Provides detailed reporting of success/failure rates

## Usage

### Reset Rate Limits
```bash
# Reset all rate limits
curl -X POST http://localhost:3000/api/test/reset-rate-limits

# Check current configuration
curl http://localhost:3000/api/test/reset-rate-limits
```

### Run Test Script
```bash
node scripts/test-rate-limits.js
```

## Environment Detection
The system automatically detects the environment and applies appropriate limits:

- **Development/Test**: Very high limits (100+ requests)
- **Production**: Original conservative limits (10-40 requests)

## Rate Limit Details

### Development/Test Environment
| Endpoint Type | Window | Max Requests | Notes |
|---------------|--------|--------------|-------|
| OTP Requests | 15 minutes | 100 | Was 10 |
| Verification | 5 minutes | 200 | Was 40 |
| General Auth | 1 minute | 100 | Was 10 |
| SMS Phone | 1 hour | 50 | Was 5 |
| SMS Email | 1 hour | 30 | Was 3 |

### Production Environment
| Endpoint Type | Window | Max Requests | Notes |
|---------------|--------|--------------|-------|
| OTP Requests | 15 minutes | 250 | 25x increase (was 10) |
| Verification | 5 minutes | 1000 | 25x increase (was 40) |
| General Auth | 1 minute | 250 | 25x increase (was 10) |
| SMS Phone | 1 hour | 4 | Set to 4 as requested |
| SMS Email | 1 hour | 4 | Set to 4 as requested |

## Testing
The rate limiting fixes ensure that:
1. Development and testing can proceed without hitting rate limits
2. Production has 25x higher limits for better user experience while maintaining security
3. SMS limits are conservatively set to 4 per hour to prevent abuse
4. Rate limits can be easily reset for testing
5. All changes are environment-aware and safe

## Files Modified
- `lib/rate-limiting.ts` - Main rate limiting logic
- `lib/sms/sms-config.ts` - SMS-specific rate limits
- `app/api/test/reset-rate-limits/route.ts` - Test utility endpoint
- `scripts/test-rate-limits.js` - Test script
