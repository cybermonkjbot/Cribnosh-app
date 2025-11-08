import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

const presence: Record<string, Set<string>> = {};

/**
 * @swagger
 * /functions/getViewerPresence:
 *   post:
 *     summary: Track Viewer Presence in Live Stream
 *     description: Track viewer presence in live streaming channels. This endpoint manages real-time viewer count and presence tracking for live cooking sessions, allowing viewers to join/leave channels and providing accurate viewer statistics.
 *     tags: [Live Streaming, Functions, Presence]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channelName
 *               - action
 *               - userId
 *             properties:
 *               channelName:
 *                 type: string
 *                 description: Live streaming channel name
 *                 example: "chef-maria-cooking"
 *               action:
 *                 type: string
 *                 enum: [join, leave]
 *                 description: Action to perform (join or leave channel)
 *                 example: "join"
 *               userId:
 *                 type: string
 *                 description: ID of the user performing the action
 *                 example: "j1234567890abcdef"
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional presence metadata
 *                 example:
 *                   deviceType: "mobile"
 *                   location: "New York, NY"
 *                   connectionType: "wifi"
 *     responses:
 *       200:
 *         description: Viewer presence updated successfully
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
 *                     channelName:
 *                       type: string
 *                       description: Channel name
 *                       example: "chef-maria-cooking"
 *                     viewerCount:
 *                       type: integer
 *                       description: Current number of viewers in the channel
 *                       example: 25
 *                     action:
 *                       type: string
 *                       enum: [join, leave]
 *                       description: Action that was performed
 *                       example: "join"
 *                     userId:
 *                       type: string
 *                       description: User ID who performed the action
 *                       example: "j1234567890abcdef"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp of the presence update
 *                       example: "2024-01-15T14:30:00Z"
 *                     presenceData:
 *                       type: object
 *                       nullable: true
 *                       description: Additional presence data
 *                       properties:
 *                         activeViewers:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: List of active viewer IDs
 *                           example: ["user1", "user2", "user3"]
 *                         joinTime:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: When the user joined (for join actions)
 *                           example: "2024-01-15T14:30:00Z"
 *                         sessionDuration:
 *                           type: integer
 *                           nullable: true
 *                           description: Session duration in seconds (for leave actions)
 *                           example: 1800
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - failed to track presence
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

export async function POST(req: NextRequest) {
  try {
    const { channelName, action, userId } = await req.json();
    
    if (!channelName || !action || !userId) {
      return ResponseFactory.validationError('Missing channelName, action, or userId');
    }

    // Use in-memory presence tracking
    if (!presence[channelName]) presence[channelName] = new Set();
    
    if (action === 'join') {
      presence[channelName].add(userId);
    } else if (action === 'leave') {
      presence[channelName].delete(userId);
    }
    
    const count = presence[channelName].size;
    return ResponseFactory.success({ channelName, viewerCount: count });
  } catch (error) {
    logger.error('Error tracking viewer presence:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}