import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

// Endpoint: /v1/auth/phone-signin
// Group: auth

const TEST_OTP = '123456'; // Test OTP for development

/**
 * @swagger
 * /auth/phone-signin:
 *   post:
 *     summary: Phone Number Authentication
 *     description: Send or verify OTP code via SMS for phone number authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - action
 *             properties:
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+1234567890"
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
 *         description: Phone authentication successful
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
 *                       example: "OTP sent successfully"
 *                     testOtp:
 *                       type: string
 *                       description: Test OTP (development only)
 *                       example: "123456"
 *                     sessionToken:
 *                       type: string
 *                       description: Session token (for verify action)
 *                       example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
 *                     user:
 *                       type: object
 *                       description: User information (for verify action)
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         phone:
 *                           type: string
 *                           example: "+1234567890"
 *                         name:
 *                           type: string
 *                           example: "User_7890"
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
async function handlePOST(request: NextRequest) {
  try {
    const { phone, action, otp } = await request.json();
    
    if (!phone) {
      return ResponseFactory.validationError('Phone number is required.');
    }

    if (!action || !['send', 'verify'].includes(action)) {
      return ResponseFactory.validationError('Action must be either "send" or "verify".' );
    }

    const convex = getConvexClient();

    if (action === 'send') {
      // Send OTP (in production, this would send SMS)
      // For now, we'll create an OTP with the test code
      await convex.mutation(api.mutations.otp.createOTP, {
        phone,
        code: TEST_OTP,
        maxAttempts: 3,
      });

      return ResponseFactory.success({ 
        success: true, 
        message: 'OTP sent successfully',
        // In development, return the test OTP for testing purposes
        ...(process.env.NODE_ENV === 'development' && { testOtp: TEST_OTP })
      });
    }

    if (action === 'verify') {
      if (!otp) {
        return ResponseFactory.validationError('OTP code is required for verification.');
      }

      // Verify OTP
      await convex.mutation(api.mutations.otp.verifyOTP, {
        phone,
        code: otp,
      });

      // Find user by phone number
      const user = await convex.query(api.queries.users.getUserByPhone, { phone });
      
      if (!user) {
        // If user doesn't exist, create a new one
        const userId = await convex.mutation(api.mutations.users.create, {
          name: `User_${phone.slice(-4)}`, // Generate a temporary name
          email: `${phone}@phone.user`, // Generate a temporary email
          password: '', // No password for phone auth
          roles: ['customer'],
          status: 'active',
        });

        // Update the user with phone number
        await convex.mutation(api.mutations.users.updateUser, {
          userId,
          phone_number: phone,
        });

        // Get the updated user
        const newUser = await convex.query(api.queries.users.getById, { 
          userId,
          sessionToken: undefined // No session token during sign-in
        });
        
        if (!newUser) {
          throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to create user');
        }

        // Ensure user has 'customer' role
        let userRoles = newUser.roles || ['user'];
        if (!userRoles.includes('customer')) {
          userRoles = ['customer'];
          await convex.mutation(api.mutations.users.updateUserRoles, {
            userId: newUser._id,
            roles: userRoles,
          });
        }

        // Check if user has 2FA enabled (new users won't have it, but check anyway)
        if (newUser.twoFactorEnabled && newUser.twoFactorSecret) {
          // Create verification session for 2FA
          const verificationToken = await convex.mutation(api.mutations.verificationSessions.createVerificationSession, {
            userId: newUser._id,
          });
          
          return ResponseFactory.success({
            success: true,
            requires2FA: true,
            verificationToken,
            message: '2FA verification required',
          });
        }

        // No 2FA required - create session token using Convex mutation
        const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
          userId: newUser._id,
          expiresInDays: 30, // 30 days expiry
        });

        // Set session token cookie
        const isProd = process.env.NODE_ENV === 'production';
        const response = ResponseFactory.success({
          success: true,
          message: 'User created and authenticated successfully',
          sessionToken: sessionResult.sessionToken,
          user: {
            user_id: newUser._id,
            phone: newUser.phone_number,
            name: newUser.name,
            roles: userRoles,
            isNewUser: true,
          },
        });
        
        response.cookies.set('convex-auth-token', sessionResult.sessionToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
        
        return response;
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

      // Check if user has 2FA enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // Create verification session for 2FA
        const verificationToken = await convex.mutation(api.mutations.verificationSessions.createVerificationSession, {
          userId: user._id,
        });
        
        // Update last login (before 2FA verification)
        await convex.mutation(api.mutations.users.updateLastLogin, {
          userId: user._id,
        });
        
        // Return verification token instead of JWT
        return ResponseFactory.success({
          success: true,
          requires2FA: true,
          verificationToken,
          message: '2FA verification required',
        });
      }

      // No 2FA required - create session token using Convex mutation
      const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
        userId: user._id,
        expiresInDays: 30, // 30 days expiry
      });

      // Update last login
      await convex.mutation(api.mutations.users.updateLastLogin, {
        userId: user._id,
      });

      // Set session token cookie
      const isProd = process.env.NODE_ENV === 'production';
      const response = ResponseFactory.success({
        success: true,
        message: 'Authentication successful',
        sessionToken: sessionResult.sessionToken,
        user: {
          user_id: user._id,
          phone: user.phone_number,
          name: user.name,
          roles: userRoles,
          isNewUser: false,
        },
      });
      
      response.cookies.set('convex-auth-token', sessionResult.sessionToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      
      return response;
    }

    return ResponseFactory.validationError('Invalid action.');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Phone sign-in failed'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
