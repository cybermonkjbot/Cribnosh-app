import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { generateOTPCode, sendOTPEmail } from '@/lib/email/send-otp-email';
import { ErrorFactory, withErrorHandling } from '@/lib/errors';
import { ErrorCode } from '@/lib/errors/types';
import { otpRateLimiter, verificationRateLimiter } from '@/lib/rate-limiting';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Endpoint: /v1/auth/email-otp
// Group: auth

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
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
 *                     token:
 *                       type: string
 *                       description: JWT token (for verify action)
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
    const { email, action, otp, name, location, referralCode, source } = await request.json();
    
    if (!email) {
      return ResponseFactory.validationError('Email is required.');
    }

    if (!action || !['send', 'verify'].includes(action)) {
      return ResponseFactory.badRequest('Action must be either "send" or "verify".' );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseFactory.validationError('Invalid email format.');
    }

    const convex = getConvexClient();

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
        console.error('Failed to send OTP email:', {
          email,
          error: emailResult.error,
          messageId: emailResult.messageId,
          timestamp: new Date().toISOString(),
        });
        
        // In development, still allow the OTP to be created even if email fails
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Development mode: Email sending failed, but continuing with OTP creation');
          console.log('🔐 Development OTP Code:', otpCode);
        } else {
          return ResponseFactory.error(
            emailResult.error || 'Failed to send verification email. Please check your email address and try again.',
            'EMAIL_SEND_FAILED',
            500
          );
        }
      } else {
        console.log('✅ OTP email sent successfully:', {
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
      });

      // Find user by email
      const user = await convex.query(api.queries.users.getUserByEmail, { email });
      
      if (!user) {
        // If user doesn't exist, create a new one for waitlist
        const userId = await convex.mutation(api.mutations.users.createMinimalUser, {
          name: email.split('@')[0],
          email: email,
        });

        // Get the created user
        const newUser = await convex.query(api.queries.users.getById, { userId });
        
        if (!newUser) {
          throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to create user');
        }

        // Ensure user has 'customer' role
        let userRoles = newUser.roles || [];
        if (!userRoles.includes('customer')) {
          userRoles = userRoles.length > 0 ? [...userRoles, 'customer'] : ['customer'];
          await convex.mutation(api.mutations.users.updateUserRoles, {
            userId: newUser._id,
            roles: userRoles,
          });
        }

        // Create JWT token
        const token = jwt.sign(
          { user_id: newUser._id, roles: userRoles }, 
          JWT_SECRET, 
          { expiresIn: '2h' }
        );

        return ResponseFactory.success({
          success: true,
          message: 'Email verified and user created successfully',
          token,
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
      }

      // Ensure user has 'customer' role for API access
      let userRoles = user.roles || ['user'];
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        // Update user roles in database
        await convex.mutation(api.mutations.users.updateUserRoles, {
          userId: user._id,
          roles: userRoles,
        });
      }

      // User exists, create JWT token
      const token = jwt.sign(
        { user_id: user._id, roles: userRoles }, 
        JWT_SECRET, 
        { expiresIn: '2h' }
      );

      // Update last login
      await convex.mutation(api.mutations.users.updateLastLogin, {
        userId: user._id,
      });

      return ResponseFactory.success({
        success: true,
        message: 'Email verified successfully',
        token,
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
    }

    return ResponseFactory.validationError('Invalid action.');
  } catch (error: unknown) {
    console.error('Email OTP error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Email OTP verification failed.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
