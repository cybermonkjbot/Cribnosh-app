import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withSensitiveRateLimit } from '@/lib/api/sensitive-middleware';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /functions/admin/getAllLiveSessions:
 *   get:
 *     summary: Get All Live Sessions (Admin)
 *     description: Retrieve all live streaming sessions with optional filtering by status and chef. This endpoint provides comprehensive access to live session data for administrative monitoring and management.
 *     tags: [Admin, Live Streaming]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, ended, paused, scheduled]
 *         description: Filter sessions by status
 *         example: "active"
 *       - in: query
 *         name: chefId
 *         schema:
 *           type: string
 *         description: Filter sessions by specific chef ID
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of sessions to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of sessions to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Live sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of live session objects
 *                   items:
 *                     type: object
 *                     properties:
 *                       sessionId:
 *                         type: string
 *                         description: Unique session identifier
 *                         example: "session_123"
 *                       chefId:
 *                         type: string
 *                         description: Chef ID who is hosting the session
 *                         example: "j1234567890abcdef"
 *                       chefName:
 *                         type: string
 *                         description: Chef's display name
 *                         example: "Chef Mario"
 *                       channelName:
 *                         type: string
 *                         description: Channel name for the live stream
 *                         example: "chef_mario_cooking"
 *                       title:
 *                         type: string
 *                         description: Session title
 *                         example: "Authentic Italian Pasta Making"
 *                       description:
 *                         type: string
 *                         description: Session description
 *                         example: "Learn to make traditional Italian pasta from scratch"
 *                       status:
 *                         type: string
 *                         enum: [active, ended, paused, scheduled]
 *                         description: Current session status
 *                         example: "active"
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         description: Session start time
 *                         example: "2024-01-15T10:00:00Z"
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Session end time (if ended)
 *                         example: "2024-01-15T12:00:00Z"
 *                       scheduledTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Scheduled start time (if scheduled)
 *                         example: "2024-01-15T15:00:00Z"
 *                       currentViewers:
 *                         type: number
 *                         description: Current number of viewers
 *                         example: 25
 *                       peakViewers:
 *                         type: number
 *                         description: Peak concurrent viewers
 *                         example: 75
 *                       totalViewers:
 *                         type: number
 *                         description: Total unique viewers
 *                         example: 150
 *                       duration:
 *                         type: number
 *                         description: Session duration in minutes
 *                         example: 120
 *                       thumbnailUrl:
 *                         type: string
 *                         nullable: true
 *                         description: Session thumbnail image URL
 *                         example: "https://example.com/thumbnails/session_123.jpg"
 *                       streamUrl:
 *                         type: string
 *                         nullable: true
 *                         description: Live stream URL
 *                         example: "https://stream.example.com/live/session_123"
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Session tags/categories
 *                         example: ["italian", "pasta", "cooking"]
 *                       cuisine:
 *                         type: string
 *                         description: Primary cuisine type
 *                         example: "Italian"
 *                       difficulty:
 *                         type: string
 *                         enum: [beginner, intermediate, advanced]
 *                         description: Cooking difficulty level
 *                         example: "intermediate"
 *                       estimatedDuration:
 *                         type: number
 *                         description: Estimated session duration in minutes
 *                         example: 90
 *                       ingredients:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Required ingredients
 *                         example: ["flour", "eggs", "tomatoes", "basil"]
 *                       equipment:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Required cooking equipment
 *                         example: ["pasta machine", "large pot", "wooden spoon"]
 *                       ordersPlaced:
 *                         type: number
 *                         description: Number of orders placed during this session
 *                         example: 8
 *                       revenue:
 *                         type: number
 *                         description: Revenue generated from this session
 *                         example: 120.50
 *                       chatEnabled:
 *                         type: boolean
 *                         description: Whether chat is enabled for this session
 *                         example: true
 *                       reactionsEnabled:
 *                         type: boolean
 *                         description: Whether reactions are enabled
 *                         example: true
 *                       recordingEnabled:
 *                         type: boolean
 *                         description: Whether the session is being recorded
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Session creation timestamp
 *                         example: "2024-01-15T09:30:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Last update timestamp
 *                         example: "2024-01-15T11:45:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid parameters
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
 *     security: []
 */

async function handleGET(req: NextRequest) {
  try {
    const client = getConvexClientFromRequest(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const chefId = searchParams.get('chefId');

    // Get all live sessions with optional filters
    const query = client.query(api.queries.liveSessions.list, {});
    
    // Apply filters if provided
    if (status || chefId) {
      const allSessions = await query;
      
      const filteredSessions = allSessions.filter((session: any) => {
        if (status && session.status !== status) return false;
        if (chefId && session.chef_id !== chefId) return false;
        return true;
      });
      
      return ResponseFactory.success(filteredSessions);
    }
    
    const result = await query;

    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    logger.error('Error getting all live sessions:', error);
    return ResponseFactory.error(getErrorMessage(error, 'Internal Server Error'), 'CUSTOM_ERROR', 500);
  }
}

export const GET = withSensitiveRateLimit(handleGET);