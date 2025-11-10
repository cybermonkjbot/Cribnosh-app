import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/payment-methods/{payment_method_id}/default:
 *   put:
 *     summary: Set a payment method as default
 *     description: Set a specific payment method as the default payment method for the customer
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: payment_method_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payment method to set as default
 *         example: "pm_0987654321"
 *     responses:
 *       200:
 *         description: Default payment method updated successfully
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
 *                   example: "Default payment method updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "pm_0987654321"
 *                     is_default:
 *                       type: boolean
 *                       example: true
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Payment method not found
 *       400:
 *         description: Payment method cannot be set as default
 *     security:
 *       - cookieAuth: []
 */
async function handlePUT(
  request: NextRequest,
  { params }: { params: { payment_method_id: string } }
): Promise<NextResponse> {
  try {
    const { payment_method_id } = params;
    
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);
    
    if (!payment_method_id) {
      return createSpecErrorResponse(
        'payment_method_id is required',
        'BAD_REQUEST',
        400
      );
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const paymentMethodId: Id<'paymentMethods'> = payment_method_id as Id<'paymentMethods'>;

    // Query payment method from database and verify it belongs to the user
    const paymentMethod = await convex.query(api.queries.paymentMethods.getById, {
      paymentMethodId,
      userId,
      sessionToken: sessionToken || undefined
    });

    if (!paymentMethod) {
      return createSpecErrorResponse(
        'Payment method not found',
        'NOT_FOUND',
        404
      );
    }

    // Verify payment method can be set as default (e.g., not expired, not deleted)
    if (paymentMethod.status !== 'active') {
      return createSpecErrorResponse(
        'Payment method cannot be set as default',
        'BAD_REQUEST',
        400
      );
    }

    // Set this payment method as default (this will also unset others)
    await convex.mutation(api.mutations.paymentMethods.setDefault, {
      paymentMethodId,
      userId,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(
      {
        id: payment_method_id,
        is_default: true,
        updated_at: new Date().toISOString(),
      },
      'Default payment method updated successfully'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to update default payment method';
    return createSpecErrorResponse(
      errorMessage,
      'INTERNAL_ERROR',
      500
    );
  }
}

// Wrapper to extract params from URL
const wrappedHandler = (request: NextRequest) => {
  const url = new URL(request.url);
  const payment_method_id = url.pathname.split('/').pop() || '';
  return handlePUT(request, { params: { payment_method_id } });
};

export const PUT = withAPIMiddleware(withErrorHandling(wrappedHandler));

