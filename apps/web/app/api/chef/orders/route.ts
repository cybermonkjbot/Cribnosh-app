import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /chef/orders:
 *   get:
 *     summary: Get Chef Orders
 *     description: Retrieve orders assigned to the authenticated chef
 *     tags: [Chef, Orders]
 *     responses:
 *       200:
 *         description: Chef orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       description: Array of orders assigned to the chef
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Order ID
 *                             example: "j1234567890abcdef"
 *                           order_id:
 *                             type: string
 *                             description: Public order ID
 *                             example: "ORD-12345"
 *                           customer_id:
 *                             type: string
 *                             description: Customer ID
 *                             example: "j1234567890abcdef"
 *                           chef_id:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           order_status:
 *                             type: string
 *                             enum: [pending, confirmed, preparing, ready, delivered, completed, cancelled]
 *                             description: Current order status
 *                             example: "preparing"
 *                           payment_status:
 *                             type: string
 *                             enum: [pending, processing, completed, failed, refunded]
 *                             description: Payment status
 *                             example: "completed"
 *                           total_amount:
 *                             type: number
 *                             description: Total order amount
 *                             example: 25.99
 *                           delivery_address:
 *                             type: object
 *                             description: Delivery address
 *                             properties:
 *                               street:
 *                                 type: string
 *                                 example: "123 Main St"
 *                               city:
 *                                 type: string
 *                                 example: "London"
 *                               postcode:
 *                                 type: string
 *                                 example: "SW1A 1AA"
 *                               country:
 *                                 type: string
 *                                 example: "UK"
 *                           special_instructions:
 *                             type: string
 *                             nullable: true
 *                             description: Special delivery instructions
 *                             example: "Leave at front door"
 *                           delivery_time:
 *                             type: string
 *                             nullable: true
 *                             description: Preferred delivery time
 *                             example: "2024-01-15T18:00:00.000Z"
 *                           estimated_prep_time_minutes:
 *                             type: number
 *                             nullable: true
 *                             description: Estimated preparation time in minutes
 *                             example: 30
 *                           chef_notes:
 *                             type: string
 *                             nullable: true
 *                             description: Chef's notes about the order
 *                             example: "Extra spicy as requested"
 *                           order_items:
 *                             type: array
 *                             description: Items in the order
 *                             items:
 *                               type: object
 *                               properties:
 *                                 dishId:
 *                                   type: string
 *                                   example: "j1234567890abcdef"
 *                                 quantity:
 *                                   type: number
 *                                   example: 2
 *                                 price:
 *                                   type: number
 *                                   example: 12.99
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Order creation timestamp
 *                             example: "2024-01-15T17:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Last update timestamp
 *                             example: "2024-01-15T17:30:00.000Z"
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
 *         description: Forbidden - only chefs can access this endpoint
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    const orders = await convex.query(api.queries.orders.listByChef, {
      chef_id: userId,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ orders });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch chef orders.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 