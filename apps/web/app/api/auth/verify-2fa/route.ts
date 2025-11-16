import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { scryptSync, timingSafeEqual } from 'crypto';
import { authenticator } from 'otplib';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     summary: Verify Two-Factor Authentication Code
 *     description: Verify 2FA code (TOTP or backup code) and complete login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verificationToken
 *               - code
 *             properties:
 *               verificationToken:
 *                 type: string
 *                 description: Temporary verification sessionResult.sessionToken from login
 *               code:
 *                 type: string
 *                 description: 6-digit TOTP code or backup code
 *     responses:
 *       200:
 *         description: 2FA verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionResult.sessionToken:
 *                       type: string
 *                       description: JWT authentication sessionResult.sessionToken
 *                     user:
 *                       type: object
 *                       description: User information
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid code or expired session
 *       429:
 *         description: Too many failed attempts
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { verificationToken, code } = await request.json();
    
    if (!verificationToken || !code) {
      return ResponseFactory.validationError('Verification sessionResult.sessionToken and code are required.');
    }
    
    const convex = getConvexClientFromRequest(request);
    
    // Get verification session
    const session = await convex.mutation(api.mutations.verificationSessions.getVerificationSession, {
      sessionToken: verificationToken,
    });
    
    if (!session) {
      return ResponseFactory.unauthorized('Invalid or expired verification session.');
    }
    
    if (session.used) {
      return ResponseFactory.unauthorized('Verification session already used.');
    }
    
    // Check if session is locked due to too many failed attempts
    if (session.failedAttempts && session.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return ResponseFactory.error(
        'Too many failed attempts. Please try again later.',
        'TOO_MANY_ATTEMPTS',
        429
      );
    }
    
    // Get user
    const sessionToken = getSessionTokenFromRequest(request);
    const user = await convex.query(api.queries.users.getById, { 
      userId: session.userId,
      sessionToken: sessionToken || undefined
    });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return ResponseFactory.unauthorized('2FA not enabled for this user.');
    }
    
    let isValid = false;
    let usedBackupCode: string | null = null;
    
    // Try TOTP verification first
    try {
      isValid = authenticator.check(code, user.twoFactorSecret);
    } catch (error) {
      logger.error('[2FA] TOTP verification error:', error);
    }
    
    // If TOTP verification failed, try backup codes
    if (!isValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      for (const hashedCode of user.twoFactorBackupCodes) {
        try {
          const [salt, storedHash] = hashedCode.split(':');
          if (!salt || !storedHash) continue;
          
          const hashToVerify = scryptSync(code, salt, 64);
          const storedHashBuffer = Buffer.from(storedHash, 'hex');
          
          if (timingSafeEqual(hashToVerify, storedHashBuffer)) {
            isValid = true;
            usedBackupCode = hashedCode;
            break;
          }
        } catch (error) {
          logger.error('[2FA] Backup code verification error:', error);
          continue;
        }
      }
    }
    
    if (!isValid) {
      // Increment failed attempts
      const newFailedAttempts = await convex.mutation(api.mutations.verificationSessions.incrementFailedAttempts, {
        sessionToken: verificationToken,
      });
      
      // Check if we've exceeded max attempts
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        return ResponseFactory.error(
          'Too many failed attempts. Please try again later.',
          'TOO_MANY_ATTEMPTS',
          429
        );
      }
      
      const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      return ResponseFactory.unauthorized(
        `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
      );
    }
    
    // Code is valid - mark session as used
    await convex.mutation(api.mutations.verificationSessions.markSessionAsUsed, {
      sessionToken: verificationToken,
    });
    
    // If backup code was used, remove it
    if (usedBackupCode) {
      await convex.mutation(api.mutations.users.removeBackupCode, {
        userId: user._id,
        hashedCode: usedBackupCode,
      });
    }
    
    // Ensure user has 'customer' role
    let userRoles = user.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      await convex.mutation(api.mutations.users.updateUserRoles, {
        userId: user._id,
        roles: userRoles,
      });
    }
    
    // Update last login
    await convex.mutation(api.mutations.users.updateLastLogin, {
      userId: user._id,
    });
    
    // Create session token using Convex mutation
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-real-ip') || 
                      request.headers.get('cf-connecting-ip') || 
                      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      undefined;
    const { getDeviceInfoFromBodyOrHeaders } = await import('@/lib/utils/device');
    const body = await request.json().catch(() => ({}));
    const deviceInfo = getDeviceInfoFromBodyOrHeaders(body, userAgent);
    
    const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
      userId: user._id,
      expiresInDays: 30, // 30 days expiry
      userAgent,
      ipAddress,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
    });
    
    // Set session token cookie
    const isProd = process.env.NODE_ENV === 'production';
    const response = ResponseFactory.success({
      success: true,
      sessionToken: sessionResult.sessionToken,
      user: {
        user_id: user._id,
        email: user.email,
        phone: user.phone_number,
        name: user.name,
        roles: userRoles,
      },
      message: '2FA verification successful',
    });
    
    response.cookies.set('convex-auth-token', sessionResult.sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

