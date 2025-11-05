import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/chefs/featured:
 *   get:
 *     summary: Get Featured Kitchens
 *     description: Get featured kitchens/chefs with filtering by sentiment (elite, live, etc.), sorted by popularity and rating
 *     tags: [Customer, Chefs, Kitchens]
 *     parameters:
 *       - in: query
 *         name: sentiment
 *         schema:
 *           type: string
 *           enum: [all, elite, bussing, fire, slaps, decent, solid, average, mid, meh, notIt, trash, skip]
 *           default: "all"
 *         description: Filter by sentiment rating
 *         example: "elite"
 *       - in: query
 *         name: is_live
 *         schema:
 *           type: boolean
 *         description: Filter by live status
 *         example: true
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of featured kitchens to return
 *         example: 20
 *     responses:
 *       200:
 *         description: Featured kitchens retrieved successfully
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
 *                     kitchens:
 *                       type: array
 *                       description: Array of featured kitchens
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Kitchen/Chef ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Kitchen/Chef name
 *                             example: "Amara's Kitchen"
 *                           cuisine:
 *                             type: string
 *                             description: Primary cuisine
 *                             example: "Nigerian"
 *                           sentiment:
 *                             type: string
 *                             description: Sentiment rating
 *                             example: "elite"
 *                           delivery_time:
 *                             type: string
 *                             description: Estimated delivery time
 *                             example: "25 min"
 *                           distance:
 *                             type: string
 *                             nullable: true
 *                             description: Distance from customer
 *                             example: "0.8 mi"
 *                           image_url:
 *                             type: string
 *                             nullable: true
 *                             description: Kitchen image URL
 *                             example: "https://example.com/kitchen.jpg"
 *                           is_live:
 *                             type: boolean
 *                             description: Whether kitchen is currently live
 *                             example: true
 *                           live_viewers:
 *                             type: integer
 *                             nullable: true
 *                             description: Number of live viewers
 *                             example: 156
 *                           avg_rating:
 *                             type: number
 *                             description: Average rating
 *                             example: 4.5
 *                           total_reviews:
 *                             type: integer
 *                             description: Total number of reviews
 *                             example: 25
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const convex = getConvexClient();
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const sentimentFilter = searchParams.get('sentiment') || 'all';
    const isLiveFilter = searchParams.get('is_live');
    const limit = parseInt(searchParams.get('limit') || '') || 20;
    
    // Get all chefs
    const chefs = await convex.query(api.queries.chefs.getAll);
    
    // Extract userId from request (optional for public endpoints)
    const userId = extractUserIdFromRequest(request);

    // Get all reviews for rating calculation
    const reviews = await convex.query(api.queries.reviews.getAll);
    
    // Get all meals to calculate cuisine and sentiment (with user preferences)
    const meals = await convex.query(api.queries.meals.getAll, { userId });
    
    // Get live sessions (if available) to check live status
    // For now, we'll use a simple heuristic based on recent activity
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Process chefs to create featured kitchens
    const featuredKitchens = await Promise.all(
      chefs.map(async (chef: any) => {
        // Get chef reviews
        const chefReviews = reviews.filter((r: any) => r.chef_id === chef._id);
        const avgRating = chefReviews.length > 0
          ? chefReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / chefReviews.length
          : chef.rating || 0;
        
        // Get chef meals
        const chefMeals = meals.filter((m: any) => m.chefId === chef._id);
        
        // Determine primary cuisine from meals or specialties
        const primaryCuisine = chefMeals.length > 0 && chefMeals[0].cuisine?.[0]
          ? chefMeals[0].cuisine[0]
          : chef.specialties?.[0] || 'Various';
        
        // Determine sentiment based on rating
        // Elite: >= 4.5, Bussing: >= 4.3, Fire: >= 4.0, Slaps: >= 3.8, etc.
        let sentiment: string;
        if (avgRating >= 4.5) sentiment = 'elite';
        else if (avgRating >= 4.3) sentiment = 'bussing';
        else if (avgRating >= 4.0) sentiment = 'fire';
        else if (avgRating >= 3.8) sentiment = 'slaps';
        else if (avgRating >= 3.5) sentiment = 'decent';
        else if (avgRating >= 3.3) sentiment = 'solid';
        else if (avgRating >= 3.0) sentiment = 'average';
        else if (avgRating >= 2.5) sentiment = 'mid';
        else if (avgRating >= 2.0) sentiment = 'meh';
        else sentiment = 'notIt';
        
        // Check if live (simplified - would need actual live session data)
        // For now, we'll simulate based on chef status and recent activity
        const isLive = chef.status === 'active' && Math.random() > 0.7; // Placeholder logic
        const liveViewers = isLive ? Math.floor(Math.random() * 500) + 50 : null;
        
        return {
          id: chef._id,
          name: chef.name || `Chef ${chef._id}`,
          cuisine: primaryCuisine,
          sentiment,
          delivery_time: '25-30 min', // Placeholder - would calculate from location
          distance: null, // Would calculate from customer location
          image_url: chef.profileImage || null,
          is_live: isLive,
          live_viewers: liveViewers,
          avg_rating: avgRating,
          total_reviews: chefReviews.length,
        };
      })
    );
    
    // Apply filters
    let filteredKitchens = featuredKitchens;
    
    if (sentimentFilter !== 'all') {
      filteredKitchens = filteredKitchens.filter(k => k.sentiment === sentimentFilter);
    }
    
    if (isLiveFilter !== null) {
      const isLiveBool = isLiveFilter === 'true';
      filteredKitchens = filteredKitchens.filter(k => k.is_live === isLiveBool);
    }
    
    // Sort by rating (descending), then by review count (descending)
    filteredKitchens.sort((a, b) => {
      if (b.avg_rating !== a.avg_rating) {
        return b.avg_rating - a.avg_rating;
      }
      return b.total_reviews - a.total_reviews;
    });
    
    // Limit results
    const limitedKitchens = filteredKitchens.slice(0, limit);
    
    return ResponseFactory.success({
      kitchens: limitedKitchens,
      total: filteredKitchens.length,
      limit,
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch featured kitchens.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

