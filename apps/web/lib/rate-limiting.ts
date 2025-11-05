// Rate limiting utilities for OTP and authentication endpoints
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    // Default: use IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    Object.keys(rateLimitStore).forEach(key => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    });
  }

  check(req: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanupExpired();
    
    const key = this.getKey(req);
    const now = Date.now();
    
    const current = rateLimitStore[key];
    
    if (!current || current.resetTime < now) {
      // New window or expired
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }
    
    if (current.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }
    
    // Increment counter
    current.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - current.count,
      resetTime: current.resetTime
    };
  }

  // Reset rate limit for a specific key (useful for testing)
  reset(req: NextRequest): boolean {
    const key = this.getKey(req);
    if (rateLimitStore[key]) {
      delete rateLimitStore[key];
      return true;
    }
    return false;
  }

  // Reset all rate limits (useful for testing)
  resetAll(): void {
    Object.keys(rateLimitStore).forEach(key => {
      delete rateLimitStore[key];
    });
  }
}

// Pre-configured rate limiters
// More lenient limits for testing and development
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

export const otpRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: isDevelopment ? 100 : 250, // 25x higher limit for production (was 10)
});

export const verificationRateLimiter = new RateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: isDevelopment ? 200 : 1000, // 25x higher limit for production (was 40)
});

export const generalAuthRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: isDevelopment ? 100 : 250, // 25x higher limit for production (was 10)
});
