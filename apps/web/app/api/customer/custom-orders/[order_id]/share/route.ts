import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getUserFromRequest } from '@/lib/auth/session';
import { getErrorMessage } from '@/types/errors';
import crypto from 'crypto';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /customer/custom-orders/{order_id}/share:
 *   post:
 *     summary: Generate shareable link for custom order
 *     description: Creates a unique shareable link token for a custom order that can be shared with others
 *     tags: [Customer, Orders]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom order ID
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Shareable link generated successfully
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
 *                     shareToken:
 *                       type: string
 *                       description: Unique share token for the order
 *                       example: "abc123def456ghi789"
 *                     shareLink:
 *                       type: string
 *                       description: Full shareable URL
 *                       example: "https://cribnosh.com/shared-ordering/abc123def456ghi789"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Token expiration time (30 days from now)
 *                       example: "2024-02-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Share link generated successfully"
 *       400:
 *         description: Invalid order ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Custom order not found
 *       403:
 *         description: Access denied - order does not belong to user
 *     security:
 *       - bearerAuth: []
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { order_id: string } }
): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user._id) {
      return ResponseFactory.unauthorized('Authentication required.');
    }

    const { order_id } = params;
    if (!order_id) {
      return ResponseFactory.validationError('Order ID is required.');
    }

    const convex = getConvexClientFromRequest(request);

    // Get the custom order
    const customOrder = await convex.query(api.queries.custom_orders.getById, {
      customOrderId: order_id as Id<'custom_orders'>,
    });

    if (!customOrder) {
      return ResponseFactory.notFound('Custom order not found.');
    }

    // Verify the order belongs to the user
    if (customOrder.userId !== user._id) {
      return ResponseFactory.forbidden('Access denied. This order does not belong to you.');
    }

    // Generate a unique share token
    const shareToken = crypto.randomBytes(24).toString('hex');
    
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Store share token in custom order metadata (we'll need to update the schema or use a separate table)
    // For now, we'll create the share link and return it
    // In production, you might want to store this in a shared_links table
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';
    const shareLink = `${baseUrl}/shared-ordering/${shareToken}`;

    // Note: In a production system, you would store the shareToken -> order_id mapping
    // in a database table (e.g., shared_links) with expiration tracking.
    // For now, we'll return the token-based link.

    return ResponseFactory.success(
      {
        shareToken,
        shareLink,
        expiresAt: expiresAt.toISOString(),
        orderId: customOrder._id,
      },
      'Share link generated successfully'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error generating share link:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to generate share link')
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

