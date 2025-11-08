import { stripe } from '@/lib/stripe';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /payments/cards/{card_id}:
 *   delete:
 *     summary: Delete Payment Card
 *     description: Remove a saved payment card from the user's account
 *     tags: [Payments, Cards]
 *     parameters:
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID to delete
 *         example: "pm_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Payment card deleted successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing card_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or Stripe configuration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

export async function DELETE(request: NextRequest, { params }: { params: { card_id: string } }) {
  try {
    const { card_id } = params;
    if (!card_id) {
      return ResponseFactory.validationError('Missing card_id');
    }
    
    // Get authenticated user from session token
    await getAuthenticatedUser(request);
    
    // Optionally, check if card belongs to user
    if (!stripe) {
      return ResponseFactory.error('Stripe is not configured.', 'CUSTOM_ERROR', 500);
    }
    
    await stripe.paymentMethods.detach(card_id);
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to detach card.';
    return ResponseFactory.internalError(errorMessage);
  }
}
