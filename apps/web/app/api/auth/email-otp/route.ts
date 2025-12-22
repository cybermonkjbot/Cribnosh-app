import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { generateOTPCode, sendOTPEmail } from '@/lib/email/send-otp-email';
import { ErrorFactory, withErrorHandling } from '@/lib/errors';
import { ErrorCode } from '@/lib/errors/types';
import { otpRateLimiter, verificationRateLimiter } from '@/lib/rate-limiting';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

// Endpoint: /v1/auth/email-otp
// Group: auth

const TEST_OTP = '123456'; // Test OTP for development

/**
 * @swagger
 * /auth/email-otp:
 *   post:
 *     summary: Email OTP Authentication
 *     description: Send or verify OTP code via email for authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - action
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               action:
 *                 type: string
 *                 enum: [send, verify]
 *                 description: Action to perform
 *                 example: "send"
 *               otp:
 *                 type: string
 *                 description: OTP code (required for verify action)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP operation successful
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Verification code sent to your email"
 *                     testOtp:
 *                       type: string
 *                       description: Test OTP (development only)
 *                       example: "123456"
 *                     sessionResult.sessionToken:
 *                       type: string
 *                       description: JWT sessionResult.sessionToken (for verify action)
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       description: User information (for verify action)
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@example.com"
 *                         name:
 *                           type: string
 *                           example: "user"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["user"]
 *                         isNewUser:
 *                           type: boolean
 *                           example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const requestBody = await request.json();
    const { email, action, otp, name, location, referralCode, source } = requestBody;

    if (!email) {
      return ResponseFactory.validationError('Email is required.');
    }

    if (!action || !['send', 'verify'].includes(action)) {
      return ResponseFactory.badRequest('Action must be either "send" or "verify".');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseFactory.validationError('Invalid email format.');
    }

    const convex = getConvexClientFromRequest(request);

    if (action === 'send') {
      // Check rate limit for OTP requests
      const rateLimitCheck = otpRateLimiter.check(request);
      if (!rateLimitCheck.allowed) {
        return ResponseFactory.error(
          `Too many OTP requests. Please try again in ${Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000 / 60)} minutes.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      // Generate OTP code
      const otpCode = process.env.NODE_ENV === 'development' ? TEST_OTP : generateOTPCode(6);

      // Send OTP email first
      const emailResult = await sendOTPEmail({
        email,
        otpCode,
        recipientName: email.split('@')[0],
        expiryMinutes: 5,
      });

      if (!emailResult.success) {
        logger.error('Failed to send OTP email:', {
          email,
          error: emailResult.error,
          messageId: emailResult.messageId,
          timestamp: new Date().toISOString(),
        });

        // In development, still allow the OTP to be created even if email fails
        if (process.env.NODE_ENV === 'development') {
          logger.warn('⚠️ Development mode: Email sending failed, but continuing with OTP creation');
          logger.log('🔐 Development OTP Code:', otpCode);
        } else {
          return ResponseFactory.error(
            emailResult.error || 'Failed to send verification email. Please check your email address and try again.',
            'EMAIL_SEND_FAILED',
            500
          );
        }
      } else {
        logger.log('✅ OTP email sent successfully:', {
          email,
          messageId: emailResult.messageId,
          timestamp: new Date().toISOString(),
        });
      }

      // Only create OTP in database after email is successfully sent
      const otpResult = await convex.mutation(api.mutations.otp.createEmailOTP, {
        email,
        code: otpCode,
        maxAttempts: 3,
        name,
        location,
        referralCode,
        source: source || 'email_otp_api',
      });

      return ResponseFactory.success({
        success: true,
        message: 'Verification code sent to your email and you have been added to our waitlist',
        waitlistId: otpResult.waitlistId,
        isExistingWaitlistUser: otpResult.isExistingWaitlistUser,
        // In development, return the test OTP for testing purposes
        ...(process.env.NODE_ENV === 'development' && { testOtp: TEST_OTP })
      });
    }

    if (action === 'verify') {
      if (!otp) {
        return ResponseFactory.validationError('OTP code is required for verification.');
      }

      // Check rate limit for verification attempts
      const rateLimitCheck = verificationRateLimiter.check(request);
      if (!rateLimitCheck.allowed) {
        return ResponseFactory.error(
          `Too many verification attempts. Please try again in ${Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000 / 60)} minutes.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      // Verify OTP
      const verificationResult = await convex.mutation(api.mutations.otp.verifyEmailOTP, {
        email,
        code: otp,
        purpose: 'waitlist', // Relax validation for waitlist signups
      });

      // Find user by email
      const user = await convex.query(api.queries.users.getUserByEmail, { email });

      if (!user) {
        // If user doesn't exist, create a new one with customer role in one call
        const newUser = await convex.mutation(api.mutations.users.createOrUpdateUserWithRoles, {
          name: email.split('@')[0],
          email: email,
          ensureCustomerRole: true,
        });

        if (!newUser) {
          throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to create user');
        }

        const userRoles = newUser.roles || ['customer'];

        // Create session sessionToken using Convex mutation
        const userAgent = request.headers.get('user-agent') || undefined;
        const ipAddress = request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          undefined;
        const { getDeviceInfoFromBodyOrHeaders } = await import('@/lib/utils/device');
        const deviceInfo = getDeviceInfoFromBodyOrHeaders(requestBody, userAgent);

        const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
          userId: newUser._id,
          expiresInDays: 30, // 30 days expiry
          userAgent,
          ipAddress,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
        });

        // Update last login
        await convex.mutation(api.mutations.users.updateLastLogin, {
          userId: newUser._id,
        });

        // Set session sessionToken cookie
        const isProd = process.env.NODE_ENV === 'production';
        const response = ResponseFactory.success({
          success: true,
          message: 'Email verified and user created successfully',
          sessionToken: sessionResult.sessionToken,
          user: {
            user_id: newUser._id,
            email: newUser.email,
            name: newUser.name,
            roles: userRoles,
            isNewUser: true,
          },
          waitlistId: verificationResult.waitlistId,
          isWaitlistUser: verificationResult.isWaitlistUser,
        });

        return response;
      }

      // Ensure user has 'customer' role for API access
      let userRoles = user.roles || ['user'];
      if (!userRoles.includes('customer')) {
        // Update user with customer role
        const updatedUser = await convex.mutation(api.mutations.users.createOrUpdateUserWithRoles, {
          name: user.name || user.email.split('@')[0],
          email: user.email,
          roles: userRoles,
          ensureCustomerRole: true,
        });
        userRoles = updatedUser.roles || userRoles;
      }

      // User exists, create JWT sessionResult.sessionToken
      // Create session sessionResult.sessionToken using Convex mutation
      const userAgent = request.headers.get('user-agent') || undefined;
      const ipAddress = request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        undefined;
      const { getDeviceInfoFromBodyOrHeaders } = await import('@/lib/utils/device');
      const deviceInfo = getDeviceInfoFromBodyOrHeaders(requestBody, userAgent);

      const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
        userId: user._id,
        expiresInDays: 30, // 30 days expiry
        userAgent,
        ipAddress,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
      });

      // Update last login
      await convex.mutation(api.mutations.users.updateLastLogin, {
        userId: user._id,
      });

      // Set session sessionToken cookie
      const isProd = process.env.NODE_ENV === 'production';
      const response = ResponseFactory.success({
        success: true,
        message: 'Email verified successfully',
        sessionToken: sessionResult.sessionToken,
        user: {
          user_id: user._id,
          email: user.email,
          name: user.name,
          roles: userRoles,
          isNewUser: false,
        },
        waitlistId: verificationResult.waitlistId,
        isWaitlistUser: verificationResult.isWaitlistUser,
      });

      return response;
    }

    return ResponseFactory.validationError('Invalid action.');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Email OTP error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Email OTP verification failed.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
