import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';

// Endpoint: /v1/auth/phone-signin
// Group: auth

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
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
        const newUser = await convex.query(api.queries.users.getById, { userId });
        
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

        // Create JWT token
        const token = jwt.sign(
          { user_id: newUser._id, roles: userRoles }, 
          JWT_SECRET, 
          { expiresIn: '2h' }
        );

        return ResponseFactory.success({
          success: true,
          message: 'User created and authenticated successfully',
          token,
          user: {
            user_id: newUser._id,
            phone: newUser.phone_number,
            name: newUser.name,
            roles: userRoles,
            isNewUser: true,
          },
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
        message: 'Authentication successful',
        token,
        user: {
          user_id: user._id,
          phone: user.phone_number,
          name: user.name,
          roles: userRoles,
          isNewUser: false,
        },
      });
    }

    return ResponseFactory.validationError('Invalid action.');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Phone sign-in failed');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
