import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
interface JWTPayload {
  user_id: string;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * @swagger
 * /custom_orders/{custom_order_id}:
 *   get:
 *     summary: Get Custom Order Details
 *     description: Retrieve detailed information about a specific custom order by its ID. This endpoint allows customers, chefs, and admins to view custom order specifications, requirements, and current status.
 *     tags: [Orders, Custom Orders]
 *     parameters:
 *       - in: path
 *         name: custom_order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the custom order
 *         example: "custom_order_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Custom order details retrieved successfully
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
 *                     _id:
 *                       type: string
 *                       description: Custom order ID
 *                       example: "custom_order_1234567890abcdef"
 *                     userId:
 *                       type: string
 *                       description: ID of the customer who placed the order
 *                       example: "j1234567890abcdef"
 *                     chefId:
 *                       type: string
 *                       nullable: true
 *                       description: ID of the assigned chef
 *                       example: "j0987654321fedcba"
 *                     requirements:
 *                       type: string
 *                       description: JSON string containing order requirements and specifications
 *                       example: '{"cuisine": "Italian", "dietary_restrictions": ["vegetarian"], "servings": 4, "budget": 50}'
 *                     status:
 *                       type: string
 *                       enum: [pending, accepted, preparing, ready, delivered, cancelled]
 *                       description: Current order status
 *                       example: "preparing"
 *                     estimatedPrice:
 *                       type: number
 *                       nullable: true
 *                       description: Estimated price for the custom order
 *                       example: 45.99
 *                     deliveryDate:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Scheduled delivery date
 *                       example: "2024-01-15T18:00:00Z"
 *                     deliveryAddress:
 *                       type: object
 *                       nullable: true
 *                       description: Delivery address details
 *                       properties:
 *                         street:
 *                           type: string
 *                           example: "123 Main St"
 *                         city:
 *                           type: string
 *                           example: "New York"
 *                         state:
 *                           type: string
 *                           example: "NY"
 *                         zipCode:
 *                           type: string
 *                           example: "10001"
 *                     specialInstructions:
 *                       type: string
 *                       nullable: true
 *                       description: Special instructions from customer
 *                       example: "Please avoid nuts and make it extra spicy"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Order creation timestamp
 *                       example: "2024-01-15T10:00:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Last update timestamp
 *                       example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing custom_order_id parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Custom order not found
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
 *   put:
 *     summary: Update Custom Order
 *     description: Update the details and requirements of a custom order. This endpoint allows customers to modify their order specifications and admins to update order information.
 *     tags: [Orders, Custom Orders]
 *     parameters:
 *       - in: path
 *         name: custom_order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the custom order
 *         example: "custom_order_1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - details
 *             properties:
 *               details:
 *                 type: object
 *                 description: Updated order requirements and specifications
 *                 properties:
 *                   cuisine:
 *                     type: string
 *                     description: Preferred cuisine type
 *                     example: "Italian"
 *                   dietary_restrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Dietary restrictions and preferences
 *                     example: ["vegetarian", "gluten-free"]
 *                   servings:
 *                     type: number
 *                     description: Number of servings needed
 *                     example: 4
 *                   budget:
 *                     type: number
 *                     description: Budget range for the order
 *                     example: 50
 *                   special_requests:
 *                     type: string
 *                     nullable: true
 *                     description: Special requests or instructions
 *                     example: "Please make it extra spicy and avoid nuts"
 *                   delivery_preferences:
 *                     type: object
 *                     nullable: true
 *                     description: Delivery preferences
 *                     properties:
 *                       preferred_time:
 *                         type: string
 *                         example: "evening"
 *                       contact_method:
 *                         type: string
 *                         example: "phone"
 *     responses:
 *       200:
 *         description: Custom order updated successfully
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
 *                     orderId:
 *                       type: string
 *                       description: ID of the updated order
 *                       example: "custom_order_1234567890abcdef"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when order was updated
 *                       example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields or invalid data
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
 *         description: Forbidden - user not authorized to update this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Custom order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Unprocessable entity - invalid order details
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
 *   delete:
 *     summary: Delete Custom Order
 *     description: Permanently delete a custom order. This action can only be performed by the order owner or administrators. This action cannot be undone.
 *     tags: [Orders, Custom Orders]
 *     parameters:
 *       - in: path
 *         name: custom_order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the custom order
 *         example: "custom_order_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Custom order deleted successfully
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
 *                     orderId:
 *                       type: string
 *                       description: ID of the deleted order
 *                       example: "custom_order_1234567890abcdef"
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when order was deleted
 *                       example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing custom_order_id parameter
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
 *         description: Forbidden - user not authorized to delete this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Custom order not found
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

// Helper to extract custom_order_id from the URL
function extractCustomOrderId(request: NextRequest): string | undefined {
  const url = new URL(request.url);
  // Assumes route is /api/custom_orders/[custom_order_id]
  const parts = url.pathname.split('/');
  return parts[parts.length - 1] || undefined;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const custom_order_id = extractCustomOrderId(request);
  if (!custom_order_id) {
    return ResponseFactory.validationError('Missing custom_order_id');
  }
  const convex = getConvexClient();
  const order = await convex.query(api.queries.custom_orders.getCustomOrderById, { customOrderId: custom_order_id });
  if (!order) {
    return ResponseFactory.notFound('Custom order not found');
  }
  return ResponseFactory.success(order);
}

async function handlePUT(request: NextRequest): Promise<NextResponse> {
  const custom_order_id = extractCustomOrderId(request);
  if (!custom_order_id) {
    return ResponseFactory.validationError('Missing custom_order_id');
  }
  // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const convex = getConvexClient();
  const order = await convex.query(api.queries.custom_orders.getCustomOrderById, { customOrderId: custom_order_id });
  if (!order) {
    return ResponseFactory.notFound('Custom order not found');
  }
  if (order.userId !== userId && payload.role !== 'admin') {
    return ResponseFactory.forbidden('Forbidden: Not your order.');
  }
  const { details } = await request.json();
  if (!details || typeof details !== 'object') {
    return ResponseFactory.error('Order details are required.', 'CUSTOM_ERROR', 422);
  }
  await convex.mutation(api.mutations.customOrders.update, {
    orderId: custom_order_id as Id<'custom_orders'>,
    updates: {
      requirements: JSON.stringify(details),
    },
  });
  return ResponseFactory.success({ success: true });
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  const custom_order_id = extractCustomOrderId(request);
  if (!custom_order_id) {
    return ResponseFactory.validationError('Missing custom_order_id');
  }
  // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const convex = getConvexClient();
  const order = await convex.query(api.queries.custom_orders.getCustomOrderById, { customOrderId: custom_order_id });
  if (!order) {
    return ResponseFactory.notFound('Custom order not found');
  }
  if (order.userId !== userId && payload.role !== 'admin') {
    return ResponseFactory.forbidden('Forbidden: Not your order.');
  }
  await convex.mutation(api.mutations.customOrders.deleteOrder, { orderId: custom_order_id as Id<'custom_orders'> });
  return ResponseFactory.success({ success: true });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
