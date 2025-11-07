import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/forkprint/score:
 *   get:
 *     summary: Get ForkPrint Score
 *     description: Get the user's ForkPrint score, current level/status, and progress to next level
 *     tags: [Customer, Profile]
 *     responses:
 *       200:
 *         description: ForkPrint score retrieved successfully
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
 *                     score:
 *                       type: number
 *                       description: Current ForkPrint score
 *                       example: 799
 *                     status:
 *                       type: string
 *                       description: Current level/status name
 *                       example: "Tastemaker"
 *                     points_to_next:
 *                       type: number
 *                       description: Points needed to reach next level
 *                       example: 3
 *                     next_level:
 *                       type: string
 *                       description: Name of next level
 *                       example: "Food Influencer"
 *                     current_level_icon:
 *                       type: string
 *                       nullable: true
 *                       description: Icon identifier for current level
 *                     level_history:
 *                       type: array
 *                       description: Array of levels unlocked with timestamps
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: string
 *                           unlocked_at:
 *                             type: string
 *                             format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: ForkPrint score not found for this user
 *     security:
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createSpecErrorResponse(
        'Invalid or missing token',
        'UNAUTHORIZED',
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can access ForkPrint score',
        'FORBIDDEN',
        403
      );
    }

    const convex = getConvexClient();
    const userId = payload.user_id as any;

    // Get ForkPrint score from Convex
    const forkPrintData = await convex.query(api.queries.forkPrint.getScoreByUserId, {
      userId,
    });

    if (!forkPrintData) {
      return createSpecErrorResponse(
        'ForkPrint score not found for this user',
        'NOT_FOUND',
        404
      );
    }

    return ResponseFactory.success({
      score: forkPrintData.score,
      status: forkPrintData.status,
      points_to_next: forkPrintData.points_to_next,
      next_level: forkPrintData.next_level,
      current_level_icon: forkPrintData.current_level_icon,
      level_history: forkPrintData.level_history,
      updated_at: forkPrintData.updated_at,
    });
  } catch (error: unknown) {
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch ForkPrint score'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

