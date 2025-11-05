import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /chat/order/message:
 *   post:
 *     summary: Send Order Message
 *     description: Send a message related to a specific order in the chat system. This endpoint allows users to communicate about order details, modifications, delivery instructions, or any order-related inquiries.
 *     tags: [Chat, Messaging, Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chatId
 *               - content
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: Unique identifier of the chat conversation
 *                 example: "j1234567890abcdef"
 *               content:
 *                 type: string
 *                 description: Message content/text
 *                 example: "Can you please add extra cheese to my order?"
 *               fileUrl:
 *                 type: string
 *                 nullable: true
 *                 description: URL of attached file (if any)
 *                 example: "https://example.com/uploads/image.jpg"
 *               fileType:
 *                 type: string
 *                 nullable: true
 *                 description: Type of attached file
 *                 example: "image/jpeg"
 *               fileName:
 *                 type: string
 *                 nullable: true
 *                 description: Name of attached file
 *                 example: "order_modification.jpg"
 *               fileSize:
 *                 type: number
 *                 nullable: true
 *                 description: Size of attached file in bytes
 *                 example: 1024000
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional metadata for the message
 *                 example:
 *                   orderId: "order_123"
 *                   messageType: "modification_request"
 *                   priority: "normal"
 *     responses:
 *       200:
 *         description: Message sent successfully
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
 *                     messageId:
 *                       type: string
 *                       description: Unique identifier of the sent message
 *                       example: "msg_1234567890abcdef"
 *                     chatId:
 *                       type: string
 *                       description: Chat conversation ID
 *                       example: "j1234567890abcdef"
 *                     senderId:
 *                       type: string
 *                       description: ID of the user who sent the message
 *                       example: "j1234567890abcdef"
 *                     content:
 *                       type: string
 *                       description: Message content
 *                       example: "Can you please add extra cheese to my order?"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Message creation timestamp
 *                       example: "2024-01-15T14:30:00Z"
 *                     fileUrl:
 *                       type: string
 *                       nullable: true
 *                       description: URL of attached file
 *                       example: "https://example.com/uploads/image.jpg"
 *                     fileType:
 *                       type: string
 *                       nullable: true
 *                       description: Type of attached file
 *                       example: "image/jpeg"
 *                     fileName:
 *                       type: string
 *                       nullable: true
 *                       description: Name of attached file
 *                       example: "order_modification.jpg"
 *                     fileSize:
 *                       type: number
 *                       nullable: true
 *                       description: Size of attached file in bytes
 *                       example: 1024000
 *                     metadata:
 *                       type: object
 *                       additionalProperties: true
 *                       nullable: true
 *                       description: Additional metadata
 *                       example:
 *                         orderId: "order_123"
 *                         messageType: "modification_request"
 *                         priority: "normal"
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
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user not authorized to send messages in this chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat not found
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

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user || !user._id) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON');
  }
  const { chatId, content, fileUrl, fileType, fileName, fileSize, metadata } = body;
  if (!chatId || !content) {
    return ResponseFactory.validationError('chatId and content are required');
  }
  const convex = getConvexClient();
  const result = await convex.mutation(api.mutations.chats.sendMessage, {
    chatId,
    senderId: user._id,
    content,
    fileUrl,
    fileType,
    fileName,
    fileSize,
    metadata,
  });
  return ResponseFactory.success(result);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 