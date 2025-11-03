import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * @swagger
 * /functions/endLiveSession:
 *   post:
 *     summary: End Live Streaming Session
 *     description: End an active live streaming session. This endpoint allows chefs or administrators to terminate a live cooking session, automatically handling cleanup, notifications, and session analytics.
 *     tags: [Live Streaming, Functions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID of the live session to end
 *                 example: "j1234567890abcdef"
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 description: Reason for ending the session
 *                 example: "Session completed successfully"
 *               notifyViewers:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify viewers about session end
 *                 example: true
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional session end metadata
 *                 example:
 *                   finalViewerCount: 25
 *                   sessionDuration: 3600
 *                   ordersPlaced: 3
 *     responses:
 *       200:
 *         description: Live session ended successfully
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
 *                     sessionId:
 *                       type: string
 *                       description: ID of the ended session
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       enum: [ended, completed, terminated]
 *                       description: Final session status
 *                       example: "ended"
 *                     endedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when session was ended
 *                       example: "2024-01-15T15:30:00Z"
 *                     sessionDuration:
 *                       type: integer
 *                       nullable: true
 *                       description: Total session duration in seconds
 *                       example: 3600
 *                     finalViewerCount:
 *                       type: integer
 *                       nullable: true
 *                       description: Number of viewers when session ended
 *                       example: 25
 *                     totalReactions:
 *                       type: integer
 *                       nullable: true
 *                       description: Total reactions received during session
 *                       example: 150
 *                     ordersPlaced:
 *                       type: integer
 *                       nullable: true
 *                       description: Number of orders placed during session
 *                       example: 3
 *                     revenue:
 *                       type: number
 *                       nullable: true
 *                       description: Revenue generated during session
 *                       example: 125.50
 *                     notificationsSent:
 *                       type: integer
 *                       nullable: true
 *                       description: Number of notifications sent to viewers
 *                       example: 25
 *                     cleanupCompleted:
 *                       type: boolean
 *                       description: Whether session cleanup was completed
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing sessionId or invalid session
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
 *       409:
 *         description: Conflict - session already ended
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - failed to end session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */

export async function POST(req: NextRequest) {
  try {
    const client = getConvexClient();
    const { sessionId } = await req.json();

          const result = await client.mutation(api.mutations.liveSessions.endLiveSession, {
        sessionId: sessionId as Id<"liveSessions">,
      });

    return ResponseFactory.success(result);
  } catch (error) {
    console.error('Error ending live session:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}