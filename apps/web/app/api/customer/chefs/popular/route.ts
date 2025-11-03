import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

// Endpoint: /v1/customer/chefs/popular
// Group: customer

/**
 * @swagger
 * /customer/chefs/popular:
 *   get:
 *     summary: Get Popular Chefs
 *     description: Get a list of popular chefs sorted by rating and review count
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Popular chefs retrieved successfully
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
 *                     chefs:
 *                       type: array
 *                       description: Array of popular chefs
 *                       items:
 *                         type: object
 *                         properties:
 *                           first_name:
 *                             type: string
 *                             description: Chef's first name
 *                             example: "John"
 *                           last_name:
 *                             type: string
 *                             description: Chef's last name
 *                             example: "Smith"
 *                           profile_image:
 *                             type: string
 *                             nullable: true
 *                             description: Chef's profile image URL
 *                             example: "https://example.com/chef-avatar.jpg"
 *                           latitude:
 *                             type: number
 *                             nullable: true
 *                             description: Chef's latitude coordinate
 *                             example: 40.7128
 *                           longitude:
 *                             type: number
 *                             nullable: true
 *                             description: Chef's longitude coordinate
 *                             example: -74.0060
 *                           address:
 *                             type: string
 *                             nullable: true
 *                             description: Chef's city
 *                             example: "New York"
 *                           experience:
 *                             type: string
 *                             nullable: true
 *                             description: Chef's specialties
 *                             example: "Italian, Mediterranean, Seafood"
 *                           profile_id:
 *                             type: string
 *                             description: Chef profile ID
 *                             example: "j1234567890abcdef"
 *                           user_id:
 *                             type: string
 *                             description: Chef user ID
 *                             example: "j1234567890abcdef"
 *                           is_approved:
 *                             type: boolean
 *                             description: Whether chef is approved
 *                             example: true
 *                           status:
 *                             type: string
 *                             description: Chef status
 *                             example: "active"
 *                           avg_rating:
 *                             type: number
 *                             description: Average rating
 *                             example: 4.5
 *                           total_reviews:
 *                             type: number
 *                             description: Total number of reviews
 *                             example: 25
 *                           total_orders:
 *                             type: number
 *                             description: Total orders (currently 0)
 *                             example: 0
 *                           is_available:
 *                             type: boolean
 *                             description: Whether chef is available
 *                             example: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Profile creation date
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             description: Profile last update date
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           distance:
 *                             type: number
 *                             nullable: true
 *                             description: Distance from customer (if location provided)
 *                           relevance_score:
 *                             type: number
 *                             nullable: true
 *                             description: Relevance score for search
 *                           matched_cuisines:
 *                             type: array
 *                             nullable: true
 *                             description: Matched cuisines for search
 *                             items:
 *                               type: string
 *                           profile_image_url:
 *                             type: string
 *                             nullable: true
 *                             description: Profile image URL
 *                             example: "https://example.com/chef-avatar.jpg"
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
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  const chefs = await convex.query((api as any).queries.chefs.getAllChefLocations, {});
  const users = await convex.query((api as any).queries.users.getAllUsers, {});
  const reviews = await convex.query((api as any).queries.reviews.getAll, {});
  // Aggregate review counts and avg ratings per chef
  const chefStats = chefs.map((chef: any) => {
    const chefUser = users.find((u: any) => u._id === chef.userId);
    const chefReviews = reviews.filter((r: any) => r.chef_id === chef._id);
    const total_reviews = chefReviews.length;
    const avg_rating = total_reviews > 0 ? chefReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total_reviews : 0;
    const [first_name, ...rest] = (chefUser?.name || '').split(' ');
    const last_name = rest.join(' ');
    return {
      first_name: first_name || '',
      last_name: last_name || '',
      profile_image: chefUser?.avatar || null,
      latitude: chef.location?.coordinates?.[0] ?? null,
      longitude: chef.location?.coordinates?.[1] ?? null,
      address: chef.location?.city ?? null,
      experience: chef.specialties?.join(', ') ?? null,
      profile_id: chef._id,
      user_id: chef.userId,
      is_approved: chef.status === 'active',
      approval_date: null,
      status: chef.status,
      avg_rating,
      total_reviews,
      total_orders: 0,
      is_available: chef.status === 'active',
      created_at: new Date(chefUser?.createdAt || Date.now()).toISOString(),
      updated_at: new Date(chefUser?.lastModified || Date.now()).toISOString(),
      distance: null,
      relevance_score: null,
      matched_cuisines: null,
      profile_image_url: chefUser?.avatar || null,
    };
  });
  // Sort by avg_rating desc, then total_reviews desc
  chefStats.sort((a: any, b: any) => b.avg_rating - a.avg_rating || b.total_reviews - a.total_reviews);
  return ResponseFactory.success({ chefs: chefStats });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 