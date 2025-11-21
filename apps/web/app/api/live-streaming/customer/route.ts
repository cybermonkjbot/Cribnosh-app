import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /live-streaming/customer:
 *   get:
 *     summary: Get Live Streaming Sessions for Customer
 *     description: Retrieve all active live streaming sessions available to customers
 *     tags: [Live Streaming, Customer]
 *     parameters:
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
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: Live streaming sessions retrieved successfully
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
 *                         example: "j1234567890abcdef"
 *                       chef_id:
 *                         type: string
 *                         description: Chef ID hosting the session
 *                         example: "j1234567890abcdef"
 *                       chef_name:
 *                         type: string
 *                         description: Name of the chef
 *                         example: "Chef Maria"
 *                       kitchen_name:
 *                         type: string
 *                         description: Name of the kitchen
 *                         example: "Chef Maria's Kitchen"
 *                       title:
 *                         type: string
 *                         description: Session title
 *                         example: "Spicy Tacos Live Cooking"
 *                       description:
 *                         type: string
 *                         description: Session description
 *                         example: "Join me for a live cooking session"
 *                       thumbnail_url:
 *                         type: string
 *                         nullable: true
 *                         description: Session thumbnail image URL
 *                         example: "https://example.com/thumbnails/session.jpg"
 *                       viewer_count:
 *                         type: number
 *                         description: Current number of viewers
 *                         example: 125
 *                       is_live:
 *                         type: boolean
 *                         description: Whether the session is currently live
 *                         example: true
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                         description: Session start time
 *                         example: "2024-01-15T10:30:00Z"
 *                       ended_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         description: Session end time (if ended)
 *                         example: null
 *                 pagination:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     page:
 *                       type: number
 *                       example: 1
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     total:
 *                       type: number
 *                       example: 15
 *                     total_pages:
 *                       type: number
 *                       example: 1
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
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const convex = getConvexClient();
    
    // Fetch active live sessions from Convex
    const activeSessions = await convex.query((api as any).queries.presence.getActiveSessions, {});

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          total_pages: 0,
        },
        message: 'No active live sessions found',
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Fetch chef data for each session and transform to LiveStream format
    const liveStreams = await Promise.all(
      activeSessions.map(async (session: any) => {
        try {
          // Fetch chef data
          const chef = await convex.query((api as any).queries.chefs.getById, {
            chefId: session.chef_id as Id<'chefs'>,
          });

          const chefName = chef?.name || `Chef ${String(session.chef_id).slice(-4)}`;
          const kitchenName = `${chefName}'s Kitchen`;

          // Transform to LiveStream interface
          return {
            id: session.session_id || String(session._id),
            chef_id: String(session.chef_id),
            chef_name: chefName,
            kitchen_name: kitchenName,
            title: session.title,
            description: session.description || undefined,
            thumbnail_url: session.thumbnailUrl || undefined,
            chef_profile_image: chef?.profileImage || undefined,
            viewer_count: session.viewerCount || session.currentViewers || 0,
            is_live: session.status === 'live',
            started_at: session.actual_start_time
              ? new Date(session.actual_start_time).toISOString()
              : session.scheduled_start_time
              ? new Date(session.scheduled_start_time).toISOString()
              : new Date(session._creationTime).toISOString(),
            ended_at: session.endedAt ? new Date(session.endedAt).toISOString() : undefined,
          };
        } catch (error) {
          logger.error(`Error fetching chef data for session ${session._id}:`, error);
          // Return session with fallback data
          const chefName = `Chef ${String(session.chef_id).slice(-4)}`;
          return {
            id: session.session_id || String(session._id),
            chef_id: String(session.chef_id),
            chef_name: chefName,
            kitchen_name: `${chefName}'s Kitchen`,
            title: session.title,
            description: session.description || undefined,
            thumbnail_url: session.thumbnailUrl || undefined,
            chef_profile_image: undefined,
            viewer_count: session.viewerCount || session.currentViewers || 0,
            is_live: session.status === 'live',
            started_at: session.actual_start_time
              ? new Date(session.actual_start_time).toISOString()
              : session.scheduled_start_time
              ? new Date(session.scheduled_start_time).toISOString()
              : new Date(session._creationTime).toISOString(),
            ended_at: session.endedAt ? new Date(session.endedAt).toISOString() : undefined,
          };
        }
      })
    );

    // Apply pagination
    const total = liveStreams.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedStreams = liveStreams.slice(offset, offset + limit);

    // Return response matching mobile app's expected structure
    // Mobile app expects: { success: boolean, data: LiveStream[], pagination?: {...} }
    // We need to return a custom response that matches this structure exactly
    return NextResponse.json({
      success: true,
      data: paginatedStreams,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
      message: 'Live streaming sessions retrieved successfully',
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    logger.error('Error in live streaming customer:', error);
    return ResponseFactory.error(
      'Failed to retrieve live streaming sessions',
      'LIVE_STREAMING_CUSTOMER_ERROR',
      500
    );
  }
});
