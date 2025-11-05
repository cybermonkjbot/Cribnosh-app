import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
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
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access this endpoint.');
    }

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Get all group orders where user is participant (completed games)
    let deliveredGroupOrders: any[] = [];
    try {
      deliveredGroupOrders = await convex.query((api as any).queries.groupOrders.getByStatus, {
        status: 'delivered',
        user_id: userId as any,
      });
    } catch {
      // If query fails, use empty array
    }

    // Also get active group orders where user is participant
    let activeGroupOrders: any[] = [];
    try {
      activeGroupOrders = await convex.query((api as any).queries.groupOrders.getActiveByUser, {
        user_id: userId as any,
      });
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
    const recentGames: any[] = [];

    for (const groupOrder of allParticipatedOrders) {
      const orderTime = groupOrder.createdAt || groupOrder._creationTime;
      
      // Track last played timestamp
      if (!lastPlayed || orderTime > lastPlayed) {
        lastPlayed = orderTime;
      }

      // Check if user is creator (simplified win condition - creator "wins")
      const isCreator = groupOrder.created_by === userId;
      if (isCreator) {
        gamesWon++;
      }

      // Calculate total amount from participants
      const totalAmount = groupOrder.participants?.reduce((sum: number, p: any) => {
        return sum + (p.total_contribution || p.contribution || 0);
      }, 0) || 0;

      // Add to recent games (limit to last 10)
      if (recentGames.length < 10) {
        recentGames.push({
          game_id: groupOrder._id,
          group_order_id: groupOrder.group_order_id || groupOrder._id,
          played_at: orderTime,
          won: isCreator,
          participants: groupOrder.participants?.length || 0,
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
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch Play to Win history.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

