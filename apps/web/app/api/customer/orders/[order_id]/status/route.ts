import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

// Endpoint: /v1/customer/orders/{order_id}/status
// Group: customer

/**
 * @swagger
 * /customer/orders/{order_id}/status:
 *   get:
 *     summary: Get Order Status
 *     description: Get the current status of a specific order
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to check status
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Order status retrieved successfully
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
 *                       description: Order details with status
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Order ID
 *                           example: "j1234567890abcdef"
 *                         customer_id:
 *                           type: string
 *                           description: Customer ID
 *                           example: "j1234567890abcdef"
 *                         chef_id:
 *                           type: string
 *                           description: Chef ID
 *                           example: "j1234567890abcdef"
 *                         order_status:
 *                           type: string
 *                           description: Current order status
 *                           enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *                           example: "preparing"
 *                         payment_status:
 *                           type: string
 *                           description: Payment status
 *                           enum: [pending, paid, failed, refunded]
 *                           example: "paid"
 *                         total_amount:
 *                           type: number
 *                           description: Total order amount
 *                           example: 31.98
 *                         order_items:
 *                           type: array
 *                           description: Items in the order
 *                           items:
 *                             type: object
 *                         special_instructions:
 *                           type: string
 *                           nullable: true
 *                           description: Special instructions
 *                           example: "Extra spicy"
 *                         estimated_prep_time_minutes:
 *                           type: number
 *                           nullable: true
 *                           description: Estimated preparation time
 *                           example: 30
 *                         chef_notes:
 *                           type: string
 *                           nullable: true
 *                           description: Notes from the chef
 *                           example: "Order will be ready in 25 minutes"
 *                         createdAt:
 *                           type: number
 *                           description: Order creation timestamp
 *                           example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing order_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
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
export async function GET(request: NextRequest, { params }: { params: { order_id: string } }): Promise<NextResponse> {
  const { order_id } = params;
  if (!order_id) {
    return ResponseFactory.validationError('Missing order_id');
  }
  const convex = getConvexClient();
  const order = await convex.query(api.queries.orders.getById, { order_id });
  if (!order) {
    return ResponseFactory.notFound('Order not found');
  }
  return ResponseFactory.success({ order });
}

/**
 * @swagger
 * /customer/orders/{order_id}/status:
 *   patch:
 *     summary: Update Order Status
 *     description: Update the status of a specific order (customer can cancel orders)
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order to update
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
 *                 description: New order status
 *                 enum: [cancelled]
 *                 example: "cancelled"
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
 *                       description: Updated order details
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         order_status:
 *                           type: string
 *                           example: "cancelled"
 *                         customer_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         chef_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         total_amount:
 *                           type: number
 *                           example: 31.98
 *                         updated_at:
 *                           type: number
 *                           description: Last update timestamp
 *                           example: 1640995200000
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
 *         description: Forbidden - only customers can update their order status
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
 *       - bearerAuth: []
 */
export async function PATCH(request: NextRequest, { params }: { params: { order_id: string } }): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can update order status.');
    }
    const { order_id } = params;
    const { status } = await request.json();
    if (!status) {
      return ResponseFactory.validationError('Missing status');
    }
    const convex = getConvexClient();
    // Fetch order and check customer_id
    const order = await convex.query(api.queries.orders.getById, { order_id });
    if (!order || order.customer_id !== payload.user_id) {
      return ResponseFactory.notFound('Order not found or not owned by customer.');
    }
    const updated = await convex.mutation(api.mutations.orders.updateStatus, { order_id, status });
    return ResponseFactory.success({ order: updated });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update order status.'));
  }
}
