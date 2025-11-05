/**
 * @swagger
 * /api/messaging/chats:
 *   get:
 *     summary: Get user chats
 *     description: Retrieve all chat conversations for the authenticated user
 *     tags: [Messaging]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of chats to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of chats to skip
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
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
 *                     chats:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     offset:
 *                       type: number
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Create chat conversation
 *     description: Create a new chat conversation with specified participants
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 2
 *                 description: Array of user IDs to include in the conversation
 *               metadata:
 *                 type: object
 *                 description: Optional metadata for the conversation
 *     responses:
 *       200:
 *         description: Chat created successfully
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
 *                   description: Created chat conversation
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - At least two participants required
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */

import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
    const convex = getConvexClient();
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Fetch all chats for this user (assuming a 'chats' table with userId or participants)
    const allChats = await convex.query(api.queries.chats.getAll, {});
    const userChats = allChats.filter((c: any) => c.userId === payload.user_id || (Array.isArray(c.participants) && c.participants.includes(payload.user_id)));
    // Consistent ordering (createdAt DESC)
    userChats.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    const paginated = userChats.slice(offset, offset + limit);
    return ResponseFactory.success({ chats: paginated, total: userChats.length, limit, offset });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch chats.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

export const POST = withAPIMiddleware(withErrorHandling(async function handlePOST(request: NextRequest): Promise<NextResponse> {
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
    const body = await request.json();
    const { participants, metadata } = body;
    if (!Array.isArray(participants) || participants.length < 2) {
      return ResponseFactory.validationError('At least two participants required');
    }
    // Ensure the current user is included
    if (!participants.includes(payload.user_id)) {
      participants.push(payload.user_id);
    }
    const convex = getConvexClient();
    const chat = await convex.mutation(api.mutations.chats.createConversation, {
      participants,
      metadata: metadata || {},
    });
    return ResponseFactory.success(chat);
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to create chat.' );
  }
})); 