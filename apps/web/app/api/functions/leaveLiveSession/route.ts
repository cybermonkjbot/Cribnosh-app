/**
 * @swagger
 * components:
 *   schemas:
 *     LeaveLiveSessionRequest:
 *       type: object
 *       required:
 *         - sessionId
 *         - userId
 *       properties:
 *         sessionId:
 *           type: string
 *           description: ID of the live session to leave
 *         userId:
 *           type: string
 *           description: ID of the user leaving the session
 *     LeaveLiveSessionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           description: Result of leaving the session
 *         message:
 *           type: string
 *           example: "Success"
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

interface LeaveLiveSessionRequest {
  sessionId: string;
  userId: string;
}

/**
 * @swagger
 * /api/functions/leaveLiveSession:
 *   post:
 *     summary: Leave live session
 *     description: Remove a user from a live streaming session
 *     tags: [Live Streaming Functions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveLiveSessionRequest'
 *     responses:
 *       200:
 *         description: Successfully left the live session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaveLiveSessionResponse'
 *       400:
 *         description: Validation error - Missing required fields
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const client = getConvexClientFromRequest(req);
    const body: LeaveLiveSessionRequest = await req.json();
    const { sessionId, userId } = body;

    if (!sessionId || !userId) {
      return ResponseFactory.validationError('Missing required fields: sessionId and userId');
    }

    const result = await client.mutation(api.mutations.liveSessions.leaveLiveSession, { 
      sessionId: sessionId as Id<"liveSessions">,
      userId: userId as Id<"users">
    });

    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    logger.error('Error leaving live session:', error);
    return ResponseFactory.error(getErrorMessage(error, 'Internal Server Error'), 'CUSTOM_ERROR', 500);
  }
}