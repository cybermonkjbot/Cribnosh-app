import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

interface OrderFromLiveRequest {
  channelName: string;
  userId: string;
  orderData: any; // This should be properly typed based on your order structure
  sessionId: string;
}

/**
 * @swagger
 * /functions/orderFromLive:
 *   post:
 *     summary: Create Order from Live Session
 *     description: Create a real order from a live streaming session when a customer places an order during the stream
 *     tags: [Orders, Live Streaming]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *               - userId
 *               - orderData
 *               - sessionId
 *             properties:
 *               channelName:
 *                 type: string
 *                 description: Live streaming channel name
 *                 example: "chef-mario-cooking"
 *               userId:
 *                 type: string
 *                 description: Customer user ID placing the order
 *                 example: "user_123"
 *               sessionId:
 *                 type: string
 *                 description: Live streaming session ID
 *                 example: "session_456"
 *               orderData:
 *                 type: object
 *                 description: Order details
 *                 required:
 *                   - items
 *                   - deliveryAddress
 *                   - paymentMethod
 *                 properties:
 *                   items:
 *                     type: array
 *                     description: Array of items being ordered
 *                     items:
 *                       type: object
 *                       properties:
 *                         menuItemId:
 *                           type: string
 *                           example: "dish_789"
 *                         name:
 *                           type: string
 *                           example: "Spicy Tacos"
 *                         quantity:
 *                           type: number
 *                           example: 2
 *                         price:
 *                           type: number
 *                           example: 12.50
 *                         specialRequests:
 *                           type: string
 *                           nullable: true
 *                           example: "Extra spicy"
 *                   specialInstructions:
 *                     type: string
 *                     nullable: true
 *                     description: Special instructions for the order
 *                     example: "Please deliver to the back door"
 *                   deliveryAddress:
 *                     type: object
 *                     description: Delivery address
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Main St"
 *                       city:
 *                         type: string
 *                         example: "New York"
 *                       state:
 *                         type: string
 *                         example: "NY"
 *                       zipCode:
 *                         type: string
 *                         example: "10001"
 *                       phoneNumber:
 *                         type: string
 *                         example: "+1-555-123-4567"
 *                   paymentMethod:
 *                     type: string
 *                     enum: [credit_card, debit_card, paypal, apple_pay, google_pay]
 *                     description: Payment method
 *                     example: "credit_card"
 *     responses:
 *       200:
 *         description: Order created successfully from live session
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
 *                       description: Created order ID
 *                       example: "order_123"
 *                     sessionId:
 *                       type: string
 *                       description: Live session ID
 *                       example: "session_456"
 *                     userId:
 *                       type: string
 *                       description: Customer user ID
 *                       example: "user_123"
 *                     status:
 *                       type: string
 *                       enum: [pending, confirmed, preparing, ready, delivered]
 *                       description: Order status
 *                       example: "pending"
 *                     totalAmount:
 *                       type: number
 *                       description: Total order amount
 *                       example: 25.00
 *                     estimatedPrepTime:
 *                       type: number
 *                       description: Estimated preparation time in minutes
 *                       example: 30
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Order creation timestamp
 *                       example: "2024-01-15T10:30:00Z"
 *                     items:
 *                       type: array
 *                       description: Order items
 *                       items:
 *                         type: object
 *                         properties:
 *                           menuItemId:
 *                             type: string
 *                             example: "dish_789"
 *                           name:
 *                             type: string
 *                             example: "Spicy Tacos"
 *                           quantity:
 *                             type: number
 *                             example: 2
 *                           price:
 *                             type: number
 *                             example: 12.50
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
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
 *       404:
 *         description: Live session not found
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
async function handlePOST(req: NextRequest) {
  try {
    const client = getConvexClient();
    const body: OrderFromLiveRequest = await req.json();
    const { channelName, userId, orderData, sessionId } = body;

    if (!channelName || !userId || !orderData || !sessionId) {
      return ResponseFactory.validationError('Missing required fields');
    }

    // Create real order from live session
    const result = await client.mutation(api.mutations.orders.createOrderFromLiveSession, {
      sessionId: sessionId as Id<"liveSessions">,
      userId: userId as Id<"users">,
      orderData: {
        items: orderData.items,
        specialInstructions: orderData.specialInstructions,
        deliveryAddress: orderData.deliveryAddress,
        paymentMethod: orderData.paymentMethod
      }
    });

    return ResponseFactory.success(result);
  } catch (error) {
    logger.error('Error creating order from live session:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const POST = withAPIMiddleware(handlePOST);