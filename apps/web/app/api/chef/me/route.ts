import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /chef/me:
 *   get:
 *     summary: Get Current Chef Profile
 *     description: Retrieve the authenticated chef's profile information including personal details, specialties, ratings, and business information. This endpoint is used by chefs to view their own profile data.
 *     tags: [Chef, Profile]
 *     responses:
 *       200:
 *         description: Chef profile retrieved successfully
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
 *                     chef:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Chef profile ID
 *                           example: "j1234567890abcdef"
 *                         userId:
 *                           type: string
 *                           description: Associated user ID
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           description: Chef's display name
 *                           example: "Chef Maria Rodriguez"
 *                         bio:
 *                           type: string
 *                           nullable: true
 *                           description: Chef's biography
 *                           example: "Passionate Italian chef with 15 years of experience"
 *                         specialties:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Chef's cooking specialties
 *                           example: ["Italian", "Mediterranean", "Pasta"]
 *                         location:
 *                           type: string
 *                           nullable: true
 *                           description: Chef's location
 *                           example: "New York, NY"
 *                         rating:
 *                           type: number
 *                           nullable: true
 *                           description: Average rating
 *                           example: 4.5
 *                         reviewCount:
 *                           type: integer
 *                           nullable: true
 *                           description: Number of reviews
 *                           example: 128
 *                         image:
 *                           type: string
 *                           nullable: true
 *                           description: Chef profile image URL
 *                           example: "https://example.com/chef-maria.jpg"
 *                         experienceYears:
 *                           type: integer
 *                           nullable: true
 *                           description: Years of cooking experience
 *                           example: 15
 *                         isVerified:
 *                           type: boolean
 *                           description: Whether chef is verified
 *                           example: true
 *                         isAvailable:
 *                           type: boolean
 *                           description: Whether chef is currently available
 *                           example: true
 *                         priceRange:
 *                           type: string
 *                           nullable: true
 *                           description: Chef's typical price range
 *                           example: "$20-40"
 *                         languages:
 *                           type: array
 *                           items:
 *                             type: string
 *                           nullable: true
 *                           description: Languages spoken by chef
 *                           example: ["English", "Spanish", "Italian"]
 *                         certifications:
 *                           type: array
 *                           items:
 *                             type: string
 *                           nullable: true
 *                           description: Chef certifications
 *                           example: ["Culinary Institute of America", "Food Safety Certified"]
 *                         cuisines:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Cuisines chef specializes in
 *                           example: ["Italian", "Mediterranean"]
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Profile creation date
 *                           example: "2024-01-15T10:00:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Last profile update date
 *                           example: "2024-01-15T14:30:00.000Z"
 *                         businessInfo:
 *                           type: object
 *                           nullable: true
 *                           description: Business information
 *                           properties:
 *                             businessName:
 *                               type: string
 *                               example: "Maria's Kitchen"
 *                             businessType:
 *                               type: string
 *                               example: "home_kitchen"
 *                             licenseNumber:
 *                               type: string
 *                               nullable: true
 *                               example: "NYC-FOOD-12345"
 *                             taxId:
 *                               type: string
 *                               nullable: true
 *                               example: "12-3456789"
 *                         stats:
 *                           type: object
 *                           nullable: true
 *                           description: Chef statistics
 *                           properties:
 *                             totalOrders:
 *                               type: integer
 *                               example: 245
 *                             totalRevenue:
 *                               type: number
 *                               example: 12500.50
 *                             averageOrderValue:
 *                               type: number
 *                               example: 51.02
 *                             completionRate:
 *                               type: number
 *                               example: 98.5
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - chef role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef profile not found
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
 *     security:
 *       - bearerAuth: []
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('chef')) {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access this endpoint.');
    }
    const convex = getConvexClient();
    // Find chef profile by userId
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId: payload.user_id });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    return ResponseFactory.success({ chef });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch chef profile.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 