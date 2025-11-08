import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

interface Order {
  _id: Id<'orders'>;
  chef_id: Id<'users'>;
  [key: string]: any;
}

interface RequestWithParams extends NextRequest {
  params: {
    order_id: string;
  };
}

/**
 * @swagger
 * /chef/orders/{order_id}/status:
 *   patch:
 *     summary: Update Order Status
 *     description: Update the status of an order assigned to the authenticated chef
 *     tags: [Chef, Orders, Order Management]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, preparing, ready, delivered, completed, cancelled]
 *                 description: New order status
 *                 example: "preparing"
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *                     order:
 *                       type: object
 *                       description: Updated order information
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Order ID
 *                           example: "j1234567890abcdef"
 *                         order_id:
 *                           type: string
 *                           description: Public order ID
 *                           example: "ORD-12345"
 *                         status:
 *                           type: string
 *                           description: Updated order status
 *                           example: "preparing"
 *                         chef_id:
 *                           type: string
 *                           description: Chef ID
 *                           example: "j1234567890abcdef"
 *                         customer_id:
 *                           type: string
 *                           description: Customer ID
 *                           example: "j1234567890abcdef"
 *                         total_amount:
 *                           type: number
 *                           description: Total order amount
 *                           example: 25.99
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Last update timestamp
 *                           example: "2024-01-15T15:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing status
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
 *       403:
 *         description: Forbidden - only chefs can update order status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found or not owned by chef
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
 *     security:
 *       - cookieAuth: []
 */
async function handlePATCH(
  request: RequestWithParams
): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const { order_id } = request.params;
    const { status } = await request.json();
    if (!status) {
      return ResponseFactory.validationError('Missing status');
    }
    const convex = getConvexClient();
    // Fetch order and check chef_id
    const order = await convex.query(api.queries.orders.getById, { order_id }) as Order | null;
    if (!order || order.chef_id !== userId) {
      return ResponseFactory.notFound('Order not found or not owned by chef.');
    }
    const updated = await convex.mutation(api.mutations.orders.updateStatus, { order_id, status });
    return ResponseFactory.success({ order: updated });
  } catch (error: any) {
    logger.error('Error updating order status:', error);
    return ResponseFactory.internalError(error.message || 'Failed to update order status.' );
  }
}

// Create a wrapped handler that extracts params correctly
const wrappedHandler = (request: NextRequest) => {
  const order_id = new URL(request.url).pathname.split('/').pop();
  return handlePATCH({
    ...request,
    params: { order_id: order_id || '' }
  } as RequestWithParams);
};

export const PATCH = withAPIMiddleware(withErrorHandling(wrappedHandler));
