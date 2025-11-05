import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface UpdateOrderRequest {
  deliveryAddress?: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  specialInstructions?: string;
  deliveryTime?: string;
  estimatedPrepTime?: number;
  chefNotes?: string;
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /orders/{order_id}:
 *   patch:
 *     summary: Update Order Details
 *     description: Update order details including delivery address, special instructions, and timing
 *     tags: [Orders, Order Management]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *         example: "ORD-12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryAddress:
 *                 type: object
 *                 description: Updated delivery address
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main Street"
 *                   city:
 *                     type: string
 *                     example: "London"
 *                   postcode:
 *                     type: string
 *                     example: "SW1A 1AA"
 *                   country:
 *                     type: string
 *                     example: "United Kingdom"
 *               specialInstructions:
 *                 type: string
 *                 description: Special delivery instructions
 *                 example: "Leave at front door, ring doorbell"
 *               deliveryTime:
 *                 type: string
 *                 format: date-time
 *                 description: Preferred delivery time
 *                 example: "2024-01-15T18:00:00.000Z"
 *               estimatedPrepTime:
 *                 type: number
 *                 description: Estimated preparation time in minutes
 *                 example: 30
 *               chefNotes:
 *                 type: string
 *                 description: Chef notes about the order
 *                 example: "Customer prefers extra spicy"
 *               metadata:
 *                 type: object
 *                 description: Additional order metadata
 *                 example: {"priority": "high", "source": "mobile_app"}
 *     responses:
 *       200:
 *         description: Order updated successfully
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
 *                     orderId:
 *                       type: string
 *                       example: "ORD-12345"
 *                     updatedFields:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["deliveryAddress", "specialInstructions"]
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:00:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Order updated successfully"
 *       400:
 *         description: Validation error - invalid request data
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
 *         description: Forbidden - insufficient permissions
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
 *     security:
 *       - bearerAuth: []
 */
async function handlePATCH(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    // Check if user has permission to update orders
    if (!['admin', 'staff', 'chef', 'customer'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const body: UpdateOrderRequest = await request.json();

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to update this specific order
    if (payload.role === 'customer' && order.customer_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own orders.');
    }
    if (payload.role === 'chef' && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own orders.');
    }

    // Check if order can be updated (not completed or cancelled)
    if (['completed', 'cancelled'].includes(order.order_status)) {
      return ResponseFactory.validationError('Order cannot be updated. Current status: ${order.order_status}.');
    }

    // Update order
    const updatedOrder = await convex.mutation(api.mutations.orders.updateOrder, {
      orderId: order._id,
      updatedBy: payload.user_id,
      deliveryAddress: body.deliveryAddress,
      specialInstructions: body.specialInstructions,
      deliveryTime: body.deliveryTime,
      estimatedPrepTime: body.estimatedPrepTime,
      chefNotes: body.chefNotes,
      metadata: {
        updatedByRole: payload.role,
        ...body.metadata
      }
    });

    console.log(`Order ${order_id} updated by ${payload.user_id} (${payload.role})`);

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error updating order:', error);
    return ResponseFactory.internalError('Failed to update order');
  }
}

/**
 * @swagger
 * /orders/{order_id}:
 *   get:
 *     summary: Get Order Details
 *     description: Retrieve detailed information about a specific order
 *     tags: [Orders, Order Management]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
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
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Internal order ID
 *                           example: "j1234567890abcdef"
 *                         orderId:
 *                           type: string
 *                           description: Public order ID
 *                           example: "ORD-12345"
 *                         customerId:
 *                           type: string
 *                           description: Customer ID
 *                           example: "j1234567890abcdef"
 *                         chefId:
 *                           type: string
 *                           description: Chef ID
 *                           example: "j1234567890abcdef"
 *                         orderStatus:
 *                           type: string
 *                           enum: [pending, confirmed, preparing, ready, delivered, completed, cancelled]
 *                           description: Current order status
 *                           example: "preparing"
 *                         paymentStatus:
 *                           type: string
 *                           enum: [pending, processing, completed, failed, refunded]
 *                           description: Payment status
 *                           example: "completed"
 *                         totalAmount:
 *                           type: number
 *                           description: Total order amount
 *                           example: 25.99
 *                         deliveryAddress:
 *                           type: object
 *                           description: Delivery address
 *                           properties:
 *                             street:
 *                               type: string
 *                               example: "123 Main St"
 *                             city:
 *                               type: string
 *                               example: "London"
 *                             postcode:
 *                               type: string
 *                               example: "SW1A 1AA"
 *                             country:
 *                               type: string
 *                               example: "UK"
 *                         specialInstructions:
 *                           type: string
 *                           nullable: true
 *                           description: Special delivery instructions
 *                           example: "Leave at front door"
 *                         deliveryTime:
 *                           type: string
 *                           nullable: true
 *                           description: Preferred delivery time
 *                           example: "2024-01-15T18:00:00.000Z"
 *                         estimatedPrepTime:
 *                           type: number
 *                           nullable: true
 *                           description: Estimated preparation time in minutes
 *                           example: 30
 *                         chefNotes:
 *                           type: string
 *                           nullable: true
 *                           description: Chef's notes about the order
 *                           example: "Extra spicy as requested"
 *                         deliveredAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Delivery timestamp
 *                           example: "2024-01-15T18:30:00.000Z"
 *                         completedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Order completion timestamp
 *                           example: "2024-01-15T18:45:00.000Z"
 *                         reviewedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Review submission timestamp
 *                           example: "2024-01-15T19:00:00.000Z"
 *                         refundEligibleUntil:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Refund eligibility deadline
 *                           example: "2024-01-16T18:30:00.000Z"
 *                         isRefundable:
 *                           type: boolean
 *                           description: Whether the order is eligible for refund
 *                           example: true
 *                         orderItems:
 *                           type: array
 *                           description: Items in the order
 *                           items:
 *                             type: object
 *                             properties:
 *                               dishId:
 *                                 type: string
 *                                 example: "j1234567890abcdef"
 *                               quantity:
 *                                 type: number
 *                                 example: 2
 *                               price:
 *                                 type: number
 *                                 example: 12.99
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Order creation timestamp
 *                           example: "2024-01-15T17:00:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Last update timestamp
 *                           example: "2024-01-15T17:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to view this order
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
 *     security:
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    // Extract order_id from URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/orders\/([^\/]+)/);
    const order_id = match ? match[1] : undefined;

    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id parameter.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId: order_id });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Verify user has permission to view this specific order
    if (payload.role === 'customer' && order.customer_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }
    if (payload.role === 'chef' && order.chef_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own orders.');
    }

    return ResponseFactory.success({
      success: true,
      order: {
        id: order._id,
        orderId: order.order_id,
        customerId: order.customer_id,
        chefId: order.chef_id,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        totalAmount: order.total_amount,
        deliveryAddress: order.delivery_address,
        specialInstructions: order.special_instructions,
        deliveryTime: order.delivery_time,
        estimatedPrepTime: order.estimated_prep_time_minutes,
        chefNotes: order.chef_notes,
        deliveredAt: order.delivered_at ? new Date(order.delivered_at).toISOString() : null,
        completedAt: order.completed_at ? new Date(order.completed_at).toISOString() : null,
        reviewedAt: order.reviewed_at ? new Date(order.reviewed_at).toISOString() : null,
        refundEligibleUntil: order.refund_eligible_until ? new Date(order.refund_eligible_until).toISOString() : null,
        isRefundable: order.is_refundable,
        orderItems: order.order_items,
        createdAt: new Date(order.createdAt).toISOString(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null
      }
    });

  } catch (error: any) {
    console.error('Order get error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to get order.' 
    );
  }
}

export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 