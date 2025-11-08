import type { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getApiQueries, getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { FunctionReference } from 'convex/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Type definitions for data structures
interface ChefLocationData {
  chefId: Id<'chefs'>;
  userId: Id<'users'>;
  city: string;
  coordinates: number[];
  bio: string;
  specialties: string[];
  rating: number;
  status: string;
  location?: {
    city: string;
    coordinates: number[];
  };
  _id?: Id<'chefs'>;
  [key: string]: unknown;
}

interface UserData {
  _id: Id<'users'>;
  name?: string;
  avatar?: string | null;
  createdAt?: number | string | Date;
  lastModified?: number | string | Date;
  [key: string]: unknown;
}

interface ReviewData {
  rating?: number;
  chef_id?: Id<'chefs'>;
  [key: string]: unknown;
}

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
  const apiQueries = getApiQueries();
  
  type ChefsLocationsQuery = FunctionReference<"query", "public", Record<string, never>, ChefLocationData[]>;
  type UsersQuery = FunctionReference<"query", "public", Record<string, never>, UserData[]>;
  type ReviewsQuery = FunctionReference<"query", "public", Record<string, never>, ReviewData[]>;
  
  const [chefs, users, reviews] = await Promise.all([
    convex.query((apiQueries.chefs.getAllChefLocations as unknown as ChefsLocationsQuery), {}) as Promise<ChefLocationData[]>,
    convex.query((apiQueries.users.getAllUsers as unknown as UsersQuery), {}) as Promise<UserData[]>,
    convex.query((apiQueries.reviews.getAll as unknown as ReviewsQuery), {}) as Promise<ReviewData[]>
  ]);
  
  // Aggregate review counts and avg ratings per chef
  const chefStats = chefs.map((chef: ChefLocationData) => {
    const chefUser = users.find((u: UserData) => u._id === chef.userId);
    const chefReviews = reviews.filter((r: ReviewData) => r.chef_id === chef.chefId);
    const total_reviews = chefReviews.length;
    const avg_rating = total_reviews > 0 ? chefReviews.reduce((sum: number, r: ReviewData) => sum + (r.rating || 0), 0) / total_reviews : 0;
    const userName = chefUser?.name || '';
    const nameParts = typeof userName === 'string' ? userName.split(' ') : [];
    const [first_name, ...rest] = nameParts;
    const last_name = rest.join(' ');
    
    // Use location object if available, otherwise use direct properties
    const location = chef.location || { city: chef.city, coordinates: chef.coordinates };
    const coordinates = location.coordinates || chef.coordinates || [];
    
    // Handle date conversion safely
    const createdAtValue = chefUser?.createdAt;
    const created_at = createdAtValue 
      ? (typeof createdAtValue === 'number' || typeof createdAtValue === 'string' 
          ? new Date(createdAtValue).toISOString() 
          : createdAtValue instanceof Date 
            ? createdAtValue.toISOString()
            : new Date().toISOString())
      : new Date().toISOString();
    
    const lastModifiedValue = chefUser?.lastModified;
    const updated_at = lastModifiedValue
      ? (typeof lastModifiedValue === 'number' || typeof lastModifiedValue === 'string'
          ? new Date(lastModifiedValue).toISOString()
          : lastModifiedValue instanceof Date
            ? lastModifiedValue.toISOString()
            : new Date().toISOString())
      : new Date().toISOString();
    
    return {
      first_name: first_name || '',
      last_name: last_name || '',
      profile_image: chefUser?.avatar || null,
      latitude: coordinates[0] ?? null,
      longitude: coordinates[1] ?? null,
      address: location.city ?? chef.city ?? null,
      experience: chef.specialties?.join(', ') ?? null,
      profile_id: chef._id || chef.chefId,
      user_id: chef.userId,
      is_approved: chef.status === 'active',
      approval_date: null,
      status: chef.status,
      avg_rating,
      total_reviews,
      total_orders: 0,
      is_available: chef.status === 'active',
      created_at,
      updated_at,
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