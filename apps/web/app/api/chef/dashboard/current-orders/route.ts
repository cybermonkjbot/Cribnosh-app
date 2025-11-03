import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface JWTPayload {
  user_id: string;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * @swagger
 * /chef/dashboard/current-orders:
 *   get:
 *     summary: Get Chef Current Orders
 *     description: Retrieve all active orders assigned to the authenticated chef. This endpoint provides chefs with their current workload including pending, confirmed, and in-progress orders for dashboard management.
 *     tags: [Chef, Orders, Dashboard]
 *     responses:
 *       200:
 *         description: Current orders retrieved successfully
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
 *                     current_orders:
 *                       type: array
 *                       description: Array of active orders assigned to the chef
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Order ID
 *                             example: "order_1234567890abcdef"
 *                           customerId:
 *                             type: string
 *                             description: ID of the customer who placed the order
 *                             example: "j1234567890abcdef"
 *                           chefId:
 *                             type: string
 *                             description: ID of the assigned chef
 *                             example: "j0987654321fedcba"
 *                           order_status:
 *                             type: string
 *                             enum: [pending, confirmed, preparing, ready, out_for_delivery]
 *                             description: Current order status
 *                             example: "preparing"
 *                           total_amount:
 *                             type: number
 *                             description: Total order amount
 *                             example: 25.99
 *                           order_date:
 *                             type: string
 *                             format: date-time
 *                             description: Order creation timestamp
 *                             example: "2024-01-15T12:00:00Z"
 *                           delivery_date:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Scheduled delivery timestamp
 *                             example: "2024-01-15T18:00:00Z"
 *                           cuisine_id:
 *                             type: string
 *                             nullable: true
 *                             description: Cuisine type ID
 *                             example: "cuisine_italian"
 *                           payment_status:
 *                             type: string
 *                             enum: [pending, paid, failed, refunded]
 *                             description: Payment status
 *                             example: "paid"
 *                           delivery_address:
 *                             type: object
 *                             nullable: true
 *                             description: Delivery address
 *                             properties:
 *                               street:
 *                                 type: string
 *                                 example: "123 Main St"
 *                               city:
 *                                 type: string
 *                                 example: "New York"
 *                               state:
 *                                 type: string
 *                                 example: "NY"
 *                               zipCode:
 *                                 type: string
 *                                 example: "10001"
 *                           special_instructions:
 *                             type: string
 *                             nullable: true
 *                             description: Special instructions from customer
 *                             example: "Please ring doorbell twice"
 *                           estimated_prep_time:
 *                             type: number
 *                             nullable: true
 *                             description: Estimated preparation time in minutes
 *                             example: 30
 *                           items:
 *                             type: array
 *                             description: Order items
 *                             items:
 *                               type: object
 *                               properties:
 *                                 dish_id:
 *                                   type: string
 *                                   example: "dish_123"
 *                                 dish_name:
 *                                   type: string
 *                                   example: "Spaghetti Carbonara"
 *                                 quantity:
 *                                   type: number
 *                                   example: 2
 *                                 price:
 *                                   type: number
 *                                   example: 12.99
 *                                 special_requests:
 *                                   type: string
 *                                   nullable: true
 *                                   example: "Extra cheese"
 *                           customer_info:
 *                             type: object
 *                             nullable: true
 *                             description: Customer information
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 example: "John Doe"
 *                               phone:
 *                                 type: string
 *                                 example: "+1234567890"
 *                               email:
 *                                 type: string
 *                                 example: "john.doe@example.com"
 *                     total_orders:
 *                       type: number
 *                       description: Total number of current orders
 *                       example: 5
 *                     orders_by_status:
 *                       type: object
 *                       description: Orders grouped by status
 *                       properties:
 *                         pending:
 *                           type: number
 *                           example: 2
 *                         confirmed:
 *                           type: number
 *                           example: 1
 *                         preparing:
 *                           type: number
 *                           example: 2
 *                         ready:
 *                           type: number
 *                           example: 0
 *                         out_for_delivery:
 *                           type: number
 *                           example: 0
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
 *         description: Forbidden - chef access required
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

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'chef') {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access current orders.');
    }
    const convex = getConvexClient();
    const orders = await convex.query(api.queries.orders.listByChef, { chef_id: payload.user_id });
    const currentOrders = orders.filter((o: { order_status: string }) => !['DELIVERED', 'CANCELLED', 'DECLINED'].includes(o.order_status));
    return ResponseFactory.success({ current_orders: currentOrders });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch current orders.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 