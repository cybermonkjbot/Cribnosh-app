import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /live-streaming/sessions:
 *   get:
 *     summary: Get Live Streaming Sessions
 *     description: Retrieve all live streaming sessions with filtering and pagination options
 *     tags: [Live Streaming, Sessions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, ended, scheduled]
 *           default: active
 *         description: Filter sessions by status
 *         example: "active"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of sessions to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of sessions to skip
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
 *                   description: Array of live streaming sessions
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Unique session identifier
 *                         example: "session_1"
 *                       chefName:
 *                         type: string
 *                         description: Name of the chef hosting the session
 *                         example: "Chef Maria"
 *                       title:
 *                         type: string
 *                         description: Session title
 *                         example: "Spicy Tacos Live Cooking"
 *                       status:
 *                         type: string
 *                         enum: [active, ended, scheduled]
 *                         description: Current session status
 *                         example: "active"
 *                       viewers:
 *                         type: number
 *                         description: Current number of viewers
 *                         example: 125
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         description: Session start time
 *                         example: "2024-01-15T10:30:00Z"
 *                 pagination:
 *                   type: object
 *                   description: Pagination information
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total number of sessions
 *                       example: 15
 *                     limit:
 *                       type: number
 *                       description: Number of sessions per page
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       description: Number of sessions skipped
 *                       example: 0
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more sessions available
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const convex = getConvexClient();
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status') || 'active';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    // For now, return mock data until Convex functions are implemented
    const mockSessions = [
      {
        id: 'session_1',
        chefName: 'Chef Maria',
        title: 'Spicy Tacos Live Cooking',
        status: 'active',
        viewers: 125,
        startTime: new Date().toISOString()
      },
      {
        id: 'session_2',
        chefName: 'Chef John',
        title: 'Pasta Making Session',
        status: 'active',
        viewers: 89,
        startTime: new Date().toISOString()
      }
    ];
    
    return ResponseFactory.success({
      data: mockSessions,
      pagination: {
        total: 15,
        limit,
        offset,
        hasMore: (offset + limit) < 15
      }
    });
  } catch (error) {
    console.error('Error in live streaming sessions:', error);
    return ResponseFactory.error('Failed to retrieve live sessions', 'LIVE_STREAMING_SESSIONS_ERROR', 500);
  }
});
