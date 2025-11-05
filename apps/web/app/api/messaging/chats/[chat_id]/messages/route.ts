/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         messageId:
 *           type: string
 *           description: Unique identifier for the message
 *         chatId:
 *           type: string
 *           description: ID of the chat conversation
 *         senderId:
 *           type: string
 *           description: ID of the message sender
 *         content:
 *           type: string
 *           description: Message content
 *         fileUrl:
 *           type: string
 *           nullable: true
 *           description: URL of attached file
 *         fileType:
 *           type: string
 *           nullable: true
 *           description: Type of attached file
 *         fileName:
 *           type: string
 *           nullable: true
 *           description: Name of attached file
 *         fileSize:
 *           type: number
 *           nullable: true
 *           description: Size of attached file in bytes
 *         metadata:
 *           type: object
 *           nullable: true
 *           description: Additional message metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the message was created
 *     SendMessageRequest:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: Message content
 *         fileUrl:
 *           type: string
 *           nullable: true
 *           description: URL of attached file
 *         fileType:
 *           type: string
 *           nullable: true
 *           description: Type of attached file
 *         fileName:
 *           type: string
 *           nullable: true
 *           description: Name of attached file
 *         fileSize:
 *           type: number
 *           nullable: true
 *           description: Size of attached file in bytes
 *         metadata:
 *           type: object
 *           nullable: true
 *           description: Additional message metadata
 */

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequestWithParams } from '@/types/next';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /api/messaging/chats/{chat_id}/messages:
 *   get:
 *     summary: Get chat messages
 *     description: Retrieve messages from a specific chat conversation
 *     tags: [Messaging]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat conversation
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatMessage'
 *                     total:
 *                       type: number
 *                       description: Total number of messages
 *                     limit:
 *                       type: number
 *                       description: Number of messages per page
 *                     offset:
 *                       type: number
 *                       description: Number of messages skipped
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing or invalid chat_id
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequestWithParams<{ chat_id: string }>): Promise<NextResponse> {
  const { params } = request;
  const { chat_id } = params;
  if (!chat_id) {
    return ResponseFactory.validationError('Missing chat_id');
  }
  let chatId: Id<'chats'>;
  try {
    chatId = chat_id as Id<'chats'>;
  } catch {
    return ResponseFactory.validationError('Invalid chat_id');
  }
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const convex = getConvexClient();
  const result = await convex.query(api.queries.chats.listMessagesForChat, { chatId, limit, offset });
  return ResponseFactory.success(result);
}

export const GET = withAPIMiddleware(withErrorHandling((req: NextRequest) => handleGET(req as NextRequestWithParams<{ chat_id: string }>)));

/**
 * @swagger
 * /api/messaging/chats/{chat_id}/messages:
 *   post:
 *     summary: Send message to chat
 *     description: Send a new message to a chat conversation
 *     tags: [Messaging]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
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
 *                       description: ID of the created message
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing required fields
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handlePOST(request: NextRequestWithParams<{ chat_id: string }>): Promise<NextResponse> {
  const { params } = request;
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
    const { chat_id } = params;
    const { content, fileUrl, fileType, fileName, fileSize, metadata } = await request.json();
    if (!content && !fileUrl) {
      return ResponseFactory.validationError('Message content or file required');
    }
    const convex = getConvexClient();
    const message = await convex.mutation(api.mutations.chats.sendMessage, {
      chatId: chat_id as Id<'chats'>,
      senderId: payload.user_id,
      content: content || '',
      fileUrl,
      fileType,
      fileName,
      fileSize,
      metadata,
    });
    return ResponseFactory.success(message);
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to send message.' );
  }
}

export const POST = withAPIMiddleware(withErrorHandling((req: NextRequest) => handlePOST(req as NextRequestWithParams<{ chat_id: string }>))); 