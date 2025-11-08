import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /chat/conversations/{chat_id}:
 *   delete:
 *     summary: Delete Chat Conversation
 *     description: Delete a chat conversation and all its messages
 *     tags: [Chat, Conversations]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat conversation ID
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
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
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *                     chatId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     messagesDeleted:
 *                       type: number
 *                       description: Number of messages deleted
 *                       example: 15
 *                 message:
 *                   type: string
 *                   example: "Conversation deleted successfully"
 *       400:
 *         description: Validation error - missing chat_id
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
 *         description: Conversation not found
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
 *   patch:
 *     summary: Update Chat Conversation
 *     description: Update chat conversation settings (mute, archive, etc.)
 *     tags: [Chat, Conversations]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat conversation ID
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               muted:
 *                 type: boolean
 *                 description: Whether conversation is muted
 *                 example: true
 *               archived:
 *                 type: boolean
 *                 description: Whether conversation is archived
 *                 example: false
 *               pinned:
 *                 type: boolean
 *                 description: Whether conversation is pinned
 *                 example: true
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional conversation metadata
 *                 example: {"theme": "dark", "notifications": "all"}
 *     responses:
 *       200:
 *         description: Conversation updated successfully
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
 *                     chatId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     updated:
 *                       type: object
 *                       properties:
 *                         muted:
 *                           type: boolean
 *                           example: true
 *                         archived:
 *                           type: boolean
 *                           example: false
 *                         pinned:
 *                           type: boolean
 *                           example: true
 *                         metadata:
 *                           type: object
 *                           example: {"theme": "dark", "notifications": "all"}
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T15:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Conversation updated successfully"
 *       400:
 *         description: Validation error - missing chat_id or invalid JSON
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
 *         description: Conversation not found
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

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user || !user._id) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  // Extract chat_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/conversations\/([^/]+)/);
  const chatId = match ? (match[1] as Id<'chats'>) : undefined;
  if (!chatId) {
    return ResponseFactory.validationError('Missing chat_id');
  }
  const convex = getConvexClient();
  const result = await convex.mutation(api.mutations.chats.deleteConversation, {
    chatId,
    userId: user._id
  });
  return ResponseFactory.success(result);
}

async function handlePATCH(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user || !user._id) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  // Extract chat_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/conversations\/([^/]+)/);
  const chatId = match ? (match[1] as Id<'chats'>) : undefined;
  if (!chatId) {
    return ResponseFactory.validationError('Missing chat_id');
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON');
  }
  const { metadata } = body;
  if (!metadata) {
    return ResponseFactory.validationError('Missing metadata');
  }
  const convex = getConvexClient();
  const result = await convex.mutation(api.mutations.chats.editConversation, {
    chatId,
    userId: user._id,
    metadata
  });
  return ResponseFactory.success(result);
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
