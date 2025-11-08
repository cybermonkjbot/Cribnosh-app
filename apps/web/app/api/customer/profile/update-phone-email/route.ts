import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling, apiErrorHandler } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextResponse } from 'next/server';
import { generateOTPCode, sendOTPEmail } from '@/lib/email/send-otp-email';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';

const TEST_OTP = '123456'; // Test OTP for development

/**
 * @swagger
 * /customer/profile/update-phone-email:
 *   post:
 *     summary: Update Customer Phone or Email with OTP Verification
 *     description: Send OTP or verify OTP to update customer's phone number or email address
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - action
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [phone, email]
 *                 description: Type of update (phone or email)
 *               action:
 *                 type: string
 *                 enum: [send, verify]
 *                 description: Action to perform (send OTP or verify OTP)
 *               phone:
 *                 type: string
 *                 description: New phone number (required for phone type)
 *                 example: "+1234567890"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: New email address (required for email type)
 *                 example: "newemail@example.com"
 *               otp:
 *                 type: string
 *                 description: OTP code (required for verify action)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP sent or verified successfully
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
 *                       example: "OTP sent successfully" or "Phone/Email updated successfully"
 *                     testOtp:
 *                       type: string
 *                       description: Test OTP (development only)
 *                       example: "123456"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated customer from session token
    const { userId } = await getAuthenticatedCustomer(request);

    const body = await request.json();
    const { type, action, phone, email, otp } = body;

    if (!type || !['phone', 'email'].includes(type)) {
      return ResponseFactory.validationError('Type must be either "phone" or "email".');
    }

    if (!action || !['send', 'verify'].includes(action)) {
      return ResponseFactory.validationError('Action must be either "send" or "verify".');
    }

    const convex = getConvexClient();

    if (action === 'send') {
      if (type === 'phone') {
        if (!phone) {
          return ResponseFactory.validationError('Phone number is required.');
        }

        // Send OTP to phone
        await convex.mutation(api.mutations.otp.createOTP, {
          phone,
          code: TEST_OTP,
          maxAttempts: 3,
        });

        return ResponseFactory.success({
          success: true,
          message: 'OTP sent successfully to your phone',
          ...(process.env.NODE_ENV === 'development' && { testOtp: TEST_OTP })
        });
      } else {
        // type === 'email'
        if (!email) {
          return ResponseFactory.validationError('Email address is required.');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return ResponseFactory.validationError('Invalid email format.');
        }

        // Generate OTP code
        const otpCode = process.env.NODE_ENV === 'development' ? TEST_OTP : generateOTPCode(6);

        // Send OTP email
        const emailResult = await sendOTPEmail({
          email,
          otpCode,
          recipientName: email.split('@')[0],
          expiryMinutes: 5,
        });

        if (!emailResult.success && process.env.NODE_ENV !== 'development') {
          return ResponseFactory.error(
            emailResult.error || 'Failed to send verification email. Please check your email address and try again.',
            'EMAIL_SEND_FAILED',
            500
          );
        }

        // Create OTP in database
        await convex.mutation(api.mutations.otp.createEmailOTP, {
          email,
          code: otpCode,
          maxAttempts: 3,
        });

        return ResponseFactory.success({
          success: true,
          message: 'OTP sent successfully to your email',
          ...(process.env.NODE_ENV === 'development' && { testOtp: TEST_OTP })
        });
      }
    }

    if (action === 'verify') {
      if (!otp) {
        return ResponseFactory.validationError('OTP code is required for verification.');
      }

      if (type === 'phone') {
        if (!phone) {
          return ResponseFactory.validationError('Phone number is required.');
        }

        // Verify OTP
        await convex.mutation(api.mutations.otp.verifyOTP, {
          phone,
          code: otp,
        });

        // Update user's phone number
        await convex.mutation(api.mutations.users.updateUser, {
          userId: userId as any,
          phone_number: phone,
        });

        return ResponseFactory.success({
          success: true,
          message: 'Phone number updated successfully',
        });
      } else {
        // type === 'email'
        if (!email) {
          return ResponseFactory.validationError('Email address is required.');
        }

        // Verify OTP
        await convex.mutation(api.mutations.otp.verifyEmailOTP, {
          email,
          code: otp,
        });

        // Update user's email
        await convex.mutation(api.mutations.users.updateUser, {
          userId: userId as any,
          email: email,
        });

        return ResponseFactory.success({
          success: true,
          message: 'Email address updated successfully',
        });
      }
    }

    return ResponseFactory.badRequest('Invalid action.');
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

