import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';

/**
 * @swagger
 * /live-streaming/customer:
 *   get:
 *     summary: Get Customer Live Streaming Status
 *     description: Retrieve the current live streaming status and data for the authenticated customer
 *     tags: [Live Streaming, Customer]
 *     responses:
 *       200:
 *         description: Customer live streaming data retrieved successfully
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
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Customer live streaming retrieved successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         watching:
 *                           type: boolean
 *                           description: Whether the customer is currently watching a live session
 *                           example: false
 *                         currentSession:
 *                           type: object
 *                           nullable: true
 *                           description: Current live session being watched
 *                           properties:
 *                             sessionId:
 *                               type: string
 *                               example: "session_123"
 *                             chefName:
 *                               type: string
 *                               example: "Chef Maria"
 *                             title:
 *                               type: string
 *                               example: "Spicy Tacos Live Cooking"
 *                             viewers:
 *                               type: number
 *                               example: 125
 *                             startTime:
 *                               type: string
 *                               format: date-time
 *                               example: "2024-01-15T10:30:00Z"
 *                         recentOrders:
 *                           type: array
 *                           description: Recent orders placed during live sessions
 *                           items:
 *                             type: object
 *                             properties:
 *                               orderId:
 *                                 type: string
 *                                 example: "order_123"
 *                               sessionId:
 *                                 type: string
 *                                 example: "session_456"
 *                               chefName:
 *                                 type: string
 *                                 example: "Chef John"
 *                               totalAmount:
 *                                 type: number
 *                                 example: 25.50
 *                               orderDate:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-01-15T10:30:00Z"
 *                               status:
 *                                 type: string
 *                                 enum: [pending, confirmed, preparing, ready, delivered]
 *                                 example: "confirmed"
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
 *         description: Forbidden - only customers can access this endpoint
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
export async function GET(request: NextRequest) {
  try {
    return ResponseFactory.success({ 
      message: 'Customer live streaming retrieved successfully',
      data: {
        watching: false,
        currentSession: null,
        recentOrders: []
      }
    });
  } catch (error) {
    console.error('Error in live streaming customer:', error);
    return ResponseFactory.error('Failed to retrieve customer live streaming', 'LIVE_STREAMING_CUSTOMER_ERROR', 500);
  }
}
