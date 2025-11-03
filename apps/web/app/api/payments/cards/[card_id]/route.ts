import { stripe } from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';

interface JWTPayload {
  user_id: string;
}

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
 *       - bearerAuth: []
 */

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

export async function DELETE(request: NextRequest, { params }: { params: { card_id: string } }) {
  const { card_id } = params;
  if (!card_id) {
    return ResponseFactory.validationError('Missing card_id');
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return ResponseFactory.unauthorized('Invalid or expired token.');
  }
  // Optionally, check if card belongs to user
  if (!stripe) {
    return ResponseFactory.error('Stripe is not configured.', 'CUSTOM_ERROR', 500);
  }
  
  try {
    await stripe.paymentMethods.detach(card_id);
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to detach card.';
    return ResponseFactory.internalError(errorMessage);
  }
}
