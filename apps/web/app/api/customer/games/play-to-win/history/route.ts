import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/games/play-to-win/history:
 *   get:
 *     summary: Get Play to Win Game History
 *     description: Get user's Play to Win game history from group orders
 *     tags: [Customer, Games]
 *     responses:
 *       200:
 *         description: Play to Win history retrieved successfully
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
 *                     gamesPlayed:
 *                       type: integer
 *                       example: 3
 *                     gamesWon:
 *                       type: integer
 *                       example: 1
 *                     lastPlayed:
 *                       type: number
 *                       nullable: true
 *                       example: 1640995200000
 *                     recentGames:
 *                       type: array
 *                       description: Recent games list
 *                       items:
 *                         type: object
 *                         properties:
 *                           game_id:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           group_order_id:
 *                             type: string
 *                             example: "group_order_123"
 *                           played_at:
 *                             type: number
 *                             example: 1640995200000
 *                           won:
 *                             type: boolean
 *                             example: true
 *                           participants:
 *                             type: integer
 *                             example: 5
 *                           total_amount:
 *                             type: number
 *                             example: 75.50
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only customers can access
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Get all group orders where user is participant (completed games)
    let deliveredGroupOrders: Array<Record<string, unknown>> = [];
    try {
      deliveredGroupOrders = await convex.query(api.queries.groupOrders.getByStatus as any, {
        status: 'delivered',
        user_id: userId,
      }) as Array<Record<string, unknown>>;
    } catch {
      // If query fails, use empty array
    }

    // Also get active group orders where user is participant
    let activeGroupOrders: Array<Record<string, unknown>> = [];
    try {
      activeGroupOrders = await convex.query(api.queries.groupOrders.getActiveByUser as any, {
        user_id: userId,
      }) as Array<Record<string, unknown>>;
    } catch {
      // If query fails, use empty array
    }

    // Combine all group orders user participated in
    const allParticipatedOrders = [...deliveredGroupOrders, ...activeGroupOrders];

    // Count games played
    const gamesPlayed = allParticipatedOrders.length;

    // Determine games won and build recent games list
    let gamesWon = 0;
    let lastPlayed: number | undefined = undefined;
    const recentGames: Array<{ game_id: string; group_order_id: string; played_at: number; won: boolean; participants: number; total_amount: number }> = [];

    for (const groupOrder of allParticipatedOrders) {
      const orderTime = (groupOrder.createdAt as number) || (groupOrder._creationTime as number);
      
      // Track last played timestamp
      if (!lastPlayed || orderTime > lastPlayed) {
        lastPlayed = orderTime;
      }

      // Check if user is creator (simplified win condition - creator "wins")
      const isCreator = (groupOrder.created_by as string) === userId;
      if (isCreator) {
        gamesWon++;
      }

      // Calculate total amount from participants
      const participants = (groupOrder.participants as Array<{ total_contribution?: number; contribution?: number }>) || [];
      const totalAmount = participants.reduce((sum: number, p: { total_contribution?: number; contribution?: number }) => {
        return sum + (p.total_contribution || p.contribution || 0);
      }, 0);

      // Add to recent games (limit to last 10)
      if (recentGames.length < 10) {
        recentGames.push({
          game_id: groupOrder._id as string,
          group_order_id: (groupOrder.group_order_id as string) || (groupOrder._id as string),
          played_at: orderTime as number,
          won: isCreator,
          participants: participants.length,
          total_amount: totalAmount,
        });
      }
    }

    // Sort recent games by played_at descending
    recentGames.sort((a, b) => b.played_at - a.played_at);

    return ResponseFactory.success({
      gamesPlayed,
      gamesWon,
      lastPlayed: lastPlayed || undefined,
      recentGames,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch Play to Win history.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

