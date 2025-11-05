import { api } from "@/convex/_generated/api";
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /functions/getLiveOrdersForChef:
 *   get:
 *     summary: Get Live Orders for Chef
 *     description: Retrieve all live orders associated with the authenticated chef. This endpoint provides chefs with real-time access to orders placed during their live streaming sessions, including order details, customer information, and status updates.
 *     tags: [Live Streaming, Functions, Orders]
 *     responses:
 *       200:
 *         description: Live orders retrieved successfully
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
 *                       description: Array of live orders for the chef
 *                       items:
 *                         type: object
 *                         properties:
 *                           orderId:
 *                             type: string
 *                             description: Order ID
 *                             example: "j1234567890abcdef"
 *                           customerId:
 *                             type: string
 *                             description: Customer ID who placed the order
 *                             example: "j1234567890abcdef"
 *                           customerName:
 *                             type: string
 *                             description: Customer's display name
 *                             example: "John Doe"
 *                           sessionId:
 *                             type: string
 *                             description: Live session ID where order was placed
 *                             example: "session_1234567890abcdef"
 *                           orderStatus:
 *                             type: string
 *                             enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *                             description: Current status of the order
 *                             example: "preparing"
 *                           totalAmount:
 *                             type: number
 *                             description: Total order amount
 *                             example: 25.50
 *                           items:
 *                             type: array
 *                             description: Order items
 *                             items:
 *                               type: object
 *                               properties:
 *                                 itemId:
 *                                   type: string
 *                                   example: "item_1234567890abcdef"
 *                                 itemName:
 *                                   type: string
 *                                   example: "Spaghetti Carbonara"
 *                                 quantity:
 *                                   type: integer
 *                                   example: 2
 *                                 price:
 *                                   type: number
 *                                   example: 12.75
 *                                 specialInstructions:
 *                                   type: string
 *                                   nullable: true
 *                                   example: "Extra cheese please"
 *                           placedAt:
 *                             type: string
 *                             format: date-time
 *                             description: When the order was placed
 *                             example: "2024-01-15T14:30:00Z"
 *                           estimatedPrepTime:
 *                             type: integer
 *                             nullable: true
 *                             description: Estimated preparation time in minutes
 *                             example: 30
 *                           deliveryAddress:
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
 *                           paymentStatus:
 *                             type: string
 *                             enum: [pending, paid, failed, refunded]
 *                             description: Payment status
 *                             example: "paid"
 *                           notes:
 *                             type: string
 *                             nullable: true
 *                             description: Additional order notes
 *                             example: "Customer prefers contactless delivery"
 *                     summary:
 *                       type: object
 *                       description: Order summary statistics
 *                       properties:
 *                         totalOrders:
 *                           type: integer
 *                           example: 15
 *                         pendingOrders:
 *                           type: integer
 *                           example: 3
 *                         preparingOrders:
 *                           type: integer
 *                           example: 5
 *                         readyOrders:
 *                           type: integer
 *                           example: 2
 *                         totalRevenue:
 *                           type: number
 *                           example: 382.50
 *                         averageOrderValue:
 *                           type: number
 *                           example: 25.50
 *                     sessionInfo:
 *                       type: object
 *                       nullable: true
 *                       description: Current live session information
 *                       properties:
 *                         sessionId:
 *                           type: string
 *                           example: "session_1234567890abcdef"
 *                         sessionTitle:
 *                           type: string
 *                           example: "Italian Cooking Masterclass"
 *                         viewerCount:
 *                           type: integer
 *                           example: 25
 *                         sessionDuration:
 *                           type: integer
 *                           example: 1800
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - chef role required
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

export async function GET(req: NextRequest) {
  try {
    const client = getConvexClient();
    const result = await client.query(api.queries.liveSessions.getLiveOrdersForChef, {});

    return ResponseFactory.success(result);
  } catch (error) {
    console.error('Error getting live orders for chef:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}