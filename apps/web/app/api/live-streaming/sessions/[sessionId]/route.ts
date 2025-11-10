import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /live-streaming/sessions/{sessionId}:
 *   get:
 *     summary: Get Live Session Details with Meal
 *     description: Retrieve a specific live session with enriched data including chef and meal information
 *     tags: [Live Streaming, Sessions]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID to retrieve
 *         example: "live-1640995200000"
 *     responses:
 *       200:
 *         description: Live session retrieved successfully
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
 *                     session:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         session_id:
 *                           type: string
 *                         chef_id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         status:
 *                           type: string
 *                         viewer_count:
 *                           type: number
 *                         current_viewers:
 *                           type: number
 *                         is_live:
 *                           type: boolean
 *                         started_at:
 *                           type: string
 *                         thumbnail_url:
 *                           type: string
 *                     chef:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         bio:
 *                           type: string
 *                         profile_image:
 *                           type: string
 *                         kitchen_name:
 *                           type: string
 *                     meal:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         price:
 *                           type: number
 *                         images:
 *                           type: array
 *                           items:
 *                             type: string
 *                         ingredients:
 *                           type: array
 *                           items:
 *                             type: string
 *                         cuisine:
 *                           type: array
 *                           items:
 *                             type: string
 *                         average_rating:
 *                           type: number
 *                         review_count:
 *                           type: number
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       404:
 *         description: Live session not found
 *       500:
 *         description: Internal server error
 *     security: []
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> => {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required',
      }, { status: 400 });
    }

    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);

    // Fetch session with enriched data (chef and meal)
    const sessionData = await convex.query((api as any).queries.liveSessions.getLiveSessionWithMeal, {
      sessionId,
      sessionToken: sessionToken || undefined
    });

    if (!sessionData || !sessionData.session) {
      return NextResponse.json({
        success: false,
        error: 'Live session not found',
      }, { status: 404 });
    }

    const { session, chef, meal } = sessionData;

    // Transform to mobile app expected format
    const transformedData = {
      session: {
        id: session.session_id || String(session._id),
        _id: String(session._id),
        session_id: session.session_id,
        chef_id: String(session.chef_id),
        title: session.title,
        description: session.description || undefined,
        status: session.status,
        viewer_count: session.viewerCount || session.currentViewers || 0,
        current_viewers: session.currentViewers || session.viewerCount || 0,
        is_live: session.status === 'live',
        started_at: session.actual_start_time
          ? new Date(session.actual_start_time).toISOString()
          : session.scheduled_start_time
          ? new Date(session.scheduled_start_time).toISOString()
          : new Date(session._creationTime).toISOString(),
        ended_at: session.endedAt ? new Date(session.endedAt).toISOString() : undefined,
        thumbnail_url: session.thumbnailUrl || undefined,
        tags: session.tags || [],
      },
      chef: chef ? {
        _id: String(chef._id),
        name: chef.name || `Chef ${String(chef._id).slice(-4)}`,
        bio: chef.bio || '',
        profile_image: chef.profileImage || undefined,
        kitchen_name: `${chef.name || `Chef ${String(chef._id).slice(-4)}`}'s Kitchen`,
        specialties: chef.specialties || [],
        rating: chef.rating || 0,
      } : null,
      meal: meal ? {
        _id: String(meal._id),
        id: String(meal._id),
        name: meal.name || '',
        description: meal.description || '',
        price: meal.price || 0,
        images: meal.images || [],
        ingredients: meal.ingredients || [],
        cuisine: meal.cuisine || [],
        dietary: meal.dietary || [],
        average_rating: meal.averageRating || meal.rating || 0,
        review_count: meal.reviewCount || 0,
        calories: meal.calories || 0,
        fat: meal.fat || '0g',
        protein: meal.protein || '0g',
        carbs: meal.carbs || '0g',
        prep_time: meal.prepTime || meal.preparationTime || undefined,
        cooking_time: meal.cookingTime || undefined,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      message: 'Live session retrieved successfully',
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    logger.error('Error getting live session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve live session',
    }, { status: 500 });
  }
});

