import { RateLimiter } from './rate-limit';

// Environment-based rate limiting
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// Create a more restrictive rate limiter for sensitive endpoints
export const sensitiveRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDevelopment ? 100 : 50, // Much higher limits for development/testing
  keyPrefix: 'rate-limit-sensitive:',
});

// Create a very restrictive rate limiter for authentication endpoints
export const authRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: isDevelopment ? 200 : 125, // Much higher limits for development/testing (25x increase)
  keyPrefix: 'rate-limit-auth:',
});

// Create a moderately restrictive rate limiter for moderation endpoints
export const moderationRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDevelopment ? 100 : 100, // Much higher limits for development/testing (5x increase)
  keyPrefix: 'rate-limit-moderation:',
});