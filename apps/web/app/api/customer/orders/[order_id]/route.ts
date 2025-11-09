import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

// Endpoint: /v1/customer/orders/{order_id}
// Group: customer

/**
 * @swagger
 * /customer/orders/{order_id}:
 *   get:
 *     summary: Get Order Details
 *     description: Get detailed information about a specific order
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to retrieve
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
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
 *                   description: Order details in standardized format
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Order ID
 *                       example: "j1234567890abcdef"
 *                     customerId:
 *                       type: string
 *                       description: Customer ID
 *                       example: "j1234567890abcdef"
 *                     chefId:
 *                       type: string
 *                       description: Chef ID
 *                       example: "j1234567890abcdef"
 *                     orderDate:
 *                       type: string
 *                       format: date-time
 *                       description: Order creation date
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     totalAmount:
 *                       type: number
 *                       description: Total order amount
 *                       example: 31.98
 *                     orderStatus:
 *                       type: string
 *                       description: Current order status
 *                       enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *                       example: "preparing"
 *                     specialInstructions:
 *                       type: string
 *                       nullable: true
 *                       description: Special instructions for the order
 *                       example: "Extra spicy, no onions"
 *                     estimatedPrepTimeMinutes:
 *                       type: number
 *                       nullable: true
 *                       description: Estimated preparation time in minutes
 *                       example: 30
 *                     chefNotes:
 *                       type: string
 *                       nullable: true
 *                       description: Notes from the chef
 *                       example: "Order will be ready in 25 minutes"
 *                     paymentStatus:
 *                       type: string
 *                       description: Payment status
 *                       enum: [pending, paid, failed, refunded]
 *                       example: "paid"
 *                     orderItems:
 *                       type: array
 *                       description: Items in the order
 *                       items:
 *                         type: object
 *                         properties:
 *                           dish_id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           quantity:
 *                             type: number
 *                             example: 2
 *                           price:
 *                             type: number
 *                             example: 15.99
 *                           name:
 *                             type: string
 *                             example: "Chicken Tikka Masala"
 *                 message:
 *                   type: string
 *                   example: "Order retrieved successfully"
 *       400:
 *         description: Validation error - missing order_id
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
 *         description: Forbidden - only customers can access their orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found or not owned by customer
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
async function handleGET(request: NextRequest, { params }: { params: { order_id: string } }) {
  const { order_id } = params;
  
  if (!order_id) {
    return ResponseFactory.validationError('Missing order_id', [
      { field: 'order_id', message: 'Order ID is required' }
    ]);
  }

  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const order = await convex.query(api.queries.orders.getById, {
      order_id: order_id,
      sessionToken: sessionToken || undefined
    });
    
    if (!order || order.customer_id !== userId) {
      return ResponseFactory.notFound('Order not found or not owned by customer');
    }

  // Map to standardized response format
  const orderData = {
    id: order._id,
    customerId: order.customer_id,
    chefId: order.chef_id,
    orderDate: new Date(order.order_date || order.createdAt || Date.now()).toISOString(),
    totalAmount: order.total_amount,
    orderStatus: order.order_status,
    specialInstructions: order.special_instructions || null,
    estimatedPrepTimeMinutes: order.estimated_prep_time_minutes || null,
    chefNotes: order.chef_notes || null,
    paymentStatus: order.payment_status,
    orderItems: order.order_items || [],
  };

    return ResponseFactory.success(orderData, 'Order retrieved successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch order.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
