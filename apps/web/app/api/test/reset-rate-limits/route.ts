import { NextRequest, NextResponse } from 'next/server';
import { otpRateLimiter, verificationRateLimiter, generalAuthRateLimiter } from '@/lib/rate-limiting';
import { authRateLimiter, sensitiveRateLimiter, moderationRateLimiter } from '@/lib/middleware/sensitive-rate-limit';
import { apiRateLimiter, authRateLimiter as middlewareAuthRateLimiter, webhookRateLimiter, searchRateLimiter } from '@/lib/middleware/rate-limit';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /test/reset-rate-limits:
 *   post:
 *     summary: Reset All Rate Limits
 *     description: |
 *       Resets all rate limiting counters across all rate limiting systems.
 *       In production, requires a secure 36-bit key for authorization.
 *       
 *       **Rate Limiters Reset:**
 *       - OTP Rate Limiter (15 min window)
 *       - Verification Rate Limiter (5 min window) 
 *       - General Auth Rate Limiter (1 min window)
 *       - Sensitive Auth Rate Limiter (5 min window)
 *       - Sensitive Rate Limiter (1 min window)
 *       - Moderation Rate Limiter (1 min window)
 *       - API Rate Limiter (15 min window)
 *       - Middleware Auth Rate Limiter (15 min window)
 *       - Webhook Rate Limiter (1 min window)
 *       - Search Rate Limiter (1 min window)
 *       
 *       **Use Cases:**
 *       - API testing and development
 *       - Clearing rate limits during automated testing
 *       - Debugging rate limiting issues
 *       - Performance testing without rate limit interference
 *       - Production emergency rate limit reset (with key)
 *     tags: [Testing, Rate Limiting]
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: "36-bit security key required in production"
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: All rate limits successfully reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All rate limits have been reset"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 environment:
 *                   type: string
 *                   example: "production"
 *                 resetLimiters:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [
 *                     "otpRateLimiter",
 *                     "verificationRateLimiter",
 *                     "generalAuthRateLimiter",
 *                     "authRateLimiter (sensitive)",
 *                     "sensitiveRateLimiter",
 *                     "moderationRateLimiter",
 *                     "apiRateLimiter",
 *                     "authRateLimiter (middleware)",
 *                     "webhookRateLimiter",
 *                     "searchRateLimiter"
 *                   ]
 *       400:
 *         description: Invalid or missing security key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid or missing security key"
 *                 message:
 *                   type: string
 *                   example: "In production, a valid 36-bit security key is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to reset rate limits"
 *                 details:
 *                   type: string
 *                   example: "Rate limiter reset failed"
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, require security key
  if (isProduction) {
    try {
      const body = await request.json();
      const providedKey = body?.key;
      
      // Valid 36-bit key: a1b2c3d4-e5f6-7890-abcd-ef1234567890
      const validKey = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      
      if (!providedKey || providedKey !== validKey) {
        return NextResponse.json(
          { 
            error: 'Invalid or missing security key',
            message: 'In production, a valid 36-bit security key is required'
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          message: 'Request body must contain a valid JSON with security key'
        },
        { status: 400 }
      );
    }
  }

  try {
    // Reset all rate limiters
    otpRateLimiter.resetAll();
    verificationRateLimiter.resetAll();
    generalAuthRateLimiter.resetAll();
    authRateLimiter.resetAll();
    sensitiveRateLimiter.resetAll();
    moderationRateLimiter.resetAll();
    apiRateLimiter.resetAll();
    middlewareAuthRateLimiter.resetAll();
    webhookRateLimiter.resetAll();
    searchRateLimiter.resetAll();

    return NextResponse.json({
      success: true,
      message: 'All rate limits have been reset',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      resetLimiters: [
        'otpRateLimiter',
        'verificationRateLimiter', 
        'generalAuthRateLimiter',
        'authRateLimiter (sensitive)',
        'sensitiveRateLimiter',
        'moderationRateLimiter',
        'apiRateLimiter',
        'authRateLimiter (middleware)',
        'webhookRateLimiter',
        'searchRateLimiter'
      ],
      ...(isProduction && { 
        securityNote: 'Rate limits reset with valid security key',
        keyUsed: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      })
    });
  } catch (error) {
    logger.error('Error resetting rate limits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset rate limits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /test/reset-rate-limits:
 *   get:
 *     summary: Get Rate Limit Configuration
 *     description: |
 *       Returns the current rate limiting configuration and usage information.
 *       Available in all environments (development, test, and production).
 *       
 *       **Rate Limiter Details:**
 *       Shows the current limits for all rate limiting systems including:
 *       - Window duration (time period)
 *       - Maximum requests allowed per window
 *       - Environment-specific limits (development vs production)
 *       
 *       **Rate Limiter Types:**
 *       - **OTP**: One-time password generation and verification
 *       - **Verification**: Email/SMS verification attempts
 *       - **General Auth**: General authentication requests
 *       - **Sensitive**: Sensitive operations requiring stricter limits
 *       - **Moderation**: Content moderation operations
 *       - **API**: General API request limits
 *       - **Webhook**: Webhook endpoint limits
 *       - **Search**: Search operation limits
 *       
 *       **Production Usage:**
 *       In production, this endpoint provides configuration information
 *       without requiring authentication, allowing monitoring of current limits.
 *     tags: [Testing, Rate Limiting]
 *     security: []
 *     responses:
 *       200:
 *         description: Rate limit configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Rate limit reset endpoint"
 *                 usage:
 *                   type: string
 *                   example: "POST to /api/test/reset-rate-limits to reset all rate limits"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 currentLimits:
 *                   type: object
 *                   properties:
 *                     otp:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 900000
 *                           description: "Window duration in milliseconds (15 minutes)"
 *                         maxRequests:
 *                           type: number
 *                           example: 100
 *                           description: "Maximum requests per window"
 *                     verification:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 300000
 *                           description: "Window duration in milliseconds (5 minutes)"
 *                         maxRequests:
 *                           type: number
 *                           example: 200
 *                     general:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 60000
 *                           description: "Window duration in milliseconds (1 minute)"
 *                         maxRequests:
 *                           type: number
 *                           example: 100
 *                     auth:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 300000
 *                           description: "Window duration in milliseconds (5 minutes)"
 *                         maxRequests:
 *                           type: number
 *                           example: 200
 *                     sensitive:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 60000
 *                           description: "Window duration in milliseconds (1 minute)"
 *                         maxRequests:
 *                           type: number
 *                           example: 100
 *                     moderation:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 60000
 *                           description: "Window duration in milliseconds (1 minute)"
 *                         maxRequests:
 *                           type: number
 *                           example: 100
 *                     api:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 900000
 *                           description: "Window duration in milliseconds (15 minutes)"
 *                         maxRequests:
 *                           type: number
 *                           example: 2000
 *                     middlewareAuth:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 900000
 *                           description: "Window duration in milliseconds (15 minutes)"
 *                         maxRequests:
 *                           type: number
 *                           example: 300
 *                     webhook:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 60000
 *                           description: "Window duration in milliseconds (1 minute)"
 *                         maxRequests:
 *                           type: number
 *                           example: 50
 *                     search:
 *                       type: object
 *                       properties:
 *                         windowMs:
 *                           type: number
 *                           example: 60000
 *                           description: "Window duration in milliseconds (1 minute)"
 *                         maxRequests:
 *                           type: number
 *                           example: 150
 *       403:
 *         description: Not available in production environment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not available in production"
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Rate limit reset endpoint',
    usage: 'POST to /api/test/reset-rate-limits to reset all rate limits',
    environment: process.env.NODE_ENV,
    productionUsage: process.env.NODE_ENV === 'production' ? {
      note: 'In production, POST requests require a security key',
      keyFormat: '36-bit UUID format',
      example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    } : null,
    currentLimits: {
      otp: {
        windowMs: 15 * 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 100 : 250
      },
      verification: {
        windowMs: 5 * 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 200 : 1000
      },
      general: {
        windowMs: 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 100 : 250
      },
      auth: {
        windowMs: 5 * 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 200 : 125
      },
      sensitive: {
        windowMs: 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 100 : 50
      },
      moderation: {
        windowMs: 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 100 : 100
      },
      api: {
        windowMs: 15 * 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 2000 : 4000
      },
      middlewareAuth: {
        windowMs: 15 * 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 300 : 300
      },
      webhook: {
        windowMs: 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 50 : 50
      },
      search: {
        windowMs: 60 * 1000,
        maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 150 : 150
      }
    }
  });
}
