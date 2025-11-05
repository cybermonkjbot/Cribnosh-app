import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

/**
 * @swagger
 * /admin/all:
 *   get:
 *     summary: Get Complete Admin Summary (Admin)
 *     description: Retrieve comprehensive system overview including all users, chefs, and orders for administrative dashboard. This endpoint provides a complete snapshot of platform data for system monitoring and management.
 *     tags: [Admin, Dashboard, Summary]
 *     responses:
 *       200:
 *         description: Complete admin summary retrieved successfully
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
 *                     usersCount:
 *                       type: number
 *                       description: Total number of users in the system
 *                       example: 1250
 *                     chefsCount:
 *                       type: number
 *                       description: Total number of chefs in the system
 *                       example: 85
 *                     ordersCount:
 *                       type: number
 *                       description: Total number of orders in the system
 *                       example: 3420
 *                     users:
 *                       type: array
 *                       description: Complete list of all users
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: User ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: User's full name
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             description: User's email address
 *                             example: "john.doe@example.com"
 *                           role:
 *                             type: string
 *                             enum: [customer, chef, admin, staff]
 *                             description: User role
 *                             example: "customer"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Account creation timestamp
 *                             example: "2024-01-15T10:00:00Z"
 *                           lastActive:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Last activity timestamp
 *                             example: "2024-01-15T14:30:00Z"
 *                           status:
 *                             type: string
 *                             enum: [active, inactive, suspended, pending]
 *                             description: Account status
 *                             example: "active"
 *                           avatar:
 *                             type: string
 *                             nullable: true
 *                             description: User avatar URL
 *                             example: "https://example.com/avatar.jpg"
 *                     chefs:
 *                       type: array
 *                       description: Complete list of all chefs
 *                       items:
 *                         type: object
 *                         properties:
 *                           chefId:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           userId:
 *                             type: string
 *                             description: Associated user ID
 *                             example: "j0987654321fedcba"
 *                           bio:
 *                             type: string
 *                             description: Chef biography
 *                             example: "Professional chef with 10 years of experience"
 *                           specialties:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Chef specialties
 *                             example: ["Italian", "Mediterranean", "Seafood"]
 *                           location:
 *                             type: string
 *                             description: Chef location
 *                             example: "New York, NY"
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average chef rating
 *                             example: 4.8
 *                           totalOrders:
 *                             type: number
 *                             description: Total orders completed
 *                             example: 150
 *                           status:
 *                             type: string
 *                             enum: [active, inactive, pending_approval, suspended]
 *                             description: Chef status
 *                             example: "active"
 *                           verified:
 *                             type: boolean
 *                             description: Whether chef is verified
 *                             example: true
 *                           joinedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Chef registration timestamp
 *                             example: "2024-01-01T00:00:00Z"
 *                     orders:
 *                       type: array
 *                       description: Complete list of all orders
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Order ID
 *                             example: "order_1234567890abcdef"
 *                           customerId:
 *                             type: string
 *                             description: Customer ID
 *                             example: "j1234567890abcdef"
 *                           chefId:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j0987654321fedcba"
 *                           total_amount:
 *                             type: number
 *                             description: Order total amount
 *                             example: 25.99
 *                           order_status:
 *                             type: string
 *                             enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *                             description: Current order status
 *                             example: "confirmed"
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
 *         description: Forbidden - admin access required
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

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
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
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    // Use new orders table
    const [users, chefs, orders] = await Promise.all([
      convex.query(api.queries.users.getAllUsers, {}),
      convex.query(api.queries.chefs.getAllChefLocations, {}),
      convex.query(api.queries.custom_orders.getAllOrders, {}),
    ]);
    return ResponseFactory.success({
      usersCount: users.length,
      chefsCount: chefs.length,
      ordersCount: orders.length,
      users,
      chefs,
      orders,
      // dishes: [], // No dishes query available
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch admin summary.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 