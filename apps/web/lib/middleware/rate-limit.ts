import { MonitoringService } from '../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

// In-memory rate limiting store
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: ReturnType<typeof setTimeout>;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  async checkRateLimit(
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = identifier;
    const resetTime = now + windowMs;
    
    const current = this.store.get(key);
    
    if (!current || current.resetTime <= now) {
      // New window or expired
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime,
      };
    }
    
    if (current.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
      };
    }
    
    // Increment count
    current.count++;
    this.store.set(key, current);
    
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
    };
  }

  async deleteRateLimit(identifier: string): Promise<boolean> {
    return this.store.delete(identifier);
  }

  // Clear all rate limit entries (useful for testing)
  clearAll(): void {
    this.store.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const rateLimitStore = new RateLimitStore();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'rate-limit:',
      ...config,
    };
  }

  async isRateLimited(identifier: string): Promise<{
    limited: boolean;
    remaining: number;
    resetMs: number;
  }> {
    try {
      const key = `${this.config.keyPrefix}${identifier}`;
      const result = await rateLimitStore.checkRateLimit(
        key,
        this.config.windowMs,
        this.config.maxRequests
      );

      const limited = !result.allowed;
      const resetMs = result.resetTime - Date.now();

      if (limited) {
        monitoring.incrementMetric('rate_limit_exceeded_total');
        monitoring.logWarning('Rate limit exceeded', {
          identifier,
          remaining: result.remaining,
          maxRequests: this.config.maxRequests,
        });
      }

      return { 
        limited, 
        remaining: result.remaining, 
        resetMs: Math.max(0, resetMs) 
      };
    } catch (error) {
      monitoring.logError(error as Error, { context: 'rate_limit_check' });
      
      // Fail open - allow request if rate limiting fails
      return { 
        limited: false, 
        remaining: this.config.maxRequests, 
        resetMs: this.config.windowMs 
      };
    }
  }

  async getRateLimitInfo(identifier: string): Promise<{
    current: number;
    limit: number;
    remaining: number;
    resetMs: number;
  }> {
    try {
      const key = `${this.config.keyPrefix}${identifier}`;
      const result = await rateLimitStore.checkRateLimit(
        key,
        this.config.windowMs,
        this.config.maxRequests
      );

      const resetMs = result.resetTime - Date.now();
      const current = this.config.maxRequests - result.remaining;

      return {
        current,
        limit: this.config.maxRequests,
        remaining: result.remaining,
        resetMs: Math.max(0, resetMs),
      };
    } catch (error) {
      monitoring.logError(error as Error, { context: 'rate_limit_info' });
      
      return {
        current: 0,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetMs: this.config.windowMs,
      };
    }
  }

  async resetRateLimit(identifier: string): Promise<boolean> {
    try {
      const key = `${this.config.keyPrefix}${identifier}`;
      return await rateLimitStore.deleteRateLimit(key);
    } catch (error) {
      monitoring.logError(error as Error, { context: 'rate_limit_reset', identifier });
      return false;
    }
  }

  // Reset all rate limits (useful for testing)
  resetAll(): void {
    try {
      // Clear all entries from the store
      rateLimitStore.clearAll();
    } catch (error) {
      monitoring.logError(error as Error, { context: 'rate_limit_reset_all' });
    }
  }
}

// Pre-configured rate limiters
// Environment-based rate limiting
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: isDevelopment ? 2000 : 4000, // Much higher limits for development/testing (5x increase)
  keyPrefix: 'api-rate-limit:',
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: isDevelopment ? 300 : 300, // Much higher limits for development/testing (5x increase)
  keyPrefix: 'auth-rate-limit:',
});

export const webhookRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDevelopment ? 50 : 50, // Much higher limits for development/testing (5x increase)
  keyPrefix: 'webhook-rate-limit:',
});

export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDevelopment ? 150 : 150, // Much higher limits for development/testing (5x increase)
  keyPrefix: 'search-rate-limit:',
});