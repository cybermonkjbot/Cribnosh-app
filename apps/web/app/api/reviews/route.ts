import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get All Reviews
 *     description: Get paginated list of all reviews with filtering options
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of reviews to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of reviews to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
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
 *                     reviews:
 *                       type: array
 *                       description: Array of reviews
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Review ID
 *                             example: "j1234567890abcdef"
 *                           user_id:
 *                             type: string
 *                             description: User ID who wrote the review
 *                             example: "j1234567890abcdef"
 *                           meal_id:
 *                             type: string
 *                             description: Meal ID being reviewed
 *                             example: "j1234567890abcdef"
 *                           rating:
 *                             type: number
 *                             minimum: 1
 *                             maximum: 5
 *                             description: Rating from 1 to 5
 *                             example: 4
 *                           comment:
 *                             type: string
 *                             nullable: true
 *                             description: Review comment
 *                             example: "Great meal, highly recommended!"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected]
 *                             description: Review status
 *                             example: "approved"
 *                           createdAt:
 *                             type: number
 *                             description: Review creation timestamp
 *                             example: 1640995200000
 *                     total:
 *                       type: number
 *                       description: Total number of reviews
 *                       example: 150
 *                     limit:
 *                       type: number
 *                       description: Number of reviews returned
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       description: Number of reviews skipped
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
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
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    const convex = getConvexClient();
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Fetch all reviews
    const allReviews = await convex.query(api.queries.reviews.getAll, {});
    // Consistent ordering (createdAt DESC)
    allReviews.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    const paginated = allReviews.slice(offset, offset + limit);
    return ResponseFactory.success({ reviews: paginated, total: allReviews.length, limit, offset });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch reviews.' );
  }
}

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create Review
 *     description: Create a new review for a meal (only for meals the user has ordered)
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - meal_id
 *               - rating
 *             properties:
 *               meal_id:
 *                 type: string
 *                 description: ID of the meal being reviewed
 *                 example: "j1234567890abcdef"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *                 example: 4
 *               comment:
 *                 type: string
 *                 nullable: true
 *                 description: Optional review comment
 *                 example: "Great meal, highly recommended!"
 *     responses:
 *       200:
 *         description: Review created successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     reviewId:
 *                       type: string
 *                       description: Created review ID
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - can only review meals you have ordered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error - missing required fields or invalid rating
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
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    const { meal_id, rating, comment } = await request.json();
    if (!meal_id || typeof rating !== 'number') {
      return ResponseFactory.error('meal_id and rating are required.', 'CUSTOM_ERROR', 422);
    }
    if (rating < 1 || rating > 5) {
      return ResponseFactory.error('Rating must be between 1 and 5.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    // Check meal ownership (user must have ordered this meal)
    const bookings = await convex.query(api.queries.bookings.getAll, {});
    const userBooking = bookings.find((b: any) => b.user_id === payload.user_id && b.meal_id === meal_id);
    if (!userBooking) {
      return ResponseFactory.forbidden('You can only review meals you have ordered.');
    }
    // Create review in Convex
    const reviewId = await convex.mutation(api.mutations.reviews.create, {
      user_id: payload.user_id,
      meal_id,
      rating,
      comment: comment || '',
      status: 'pending',
      createdAt: Date.now(),
    });
    return ResponseFactory.success({ success: true, reviewId });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to create review.' );
  }
}

async function handlePATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    const { review_id, rating, comment } = await request.json();
    if (!review_id) {
      return ResponseFactory.error('review_id is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const allReviews = await convex.query(api.queries.reviews.getAll, {});
    const review = allReviews.find((r: any) => r._id === review_id);
    if (!review) {
      return ResponseFactory.notFound('Review not found.');
    }
    if (review.status === 'approved') {
      return ResponseFactory.forbidden('Cannot update an approved review.');
    }
    if (review.user_id !== payload.user_id) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own reviews.');
    }
    await convex.mutation(api.mutations.reviews.updateReview, {
      reviewId: review_id,
      rating,
      comment,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to update review.' );
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    const { review_id } = await request.json();
    if (!review_id) {
      return ResponseFactory.error('review_id is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const allReviews = await convex.query(api.queries.reviews.getAll, {});
    const review = allReviews.find((r: any) => r._id === review_id);
    if (!review) {
      return ResponseFactory.notFound('Review not found.');
    }
    // Allow user to delete their own review if not approved, or admin to delete any review
    if (review.user_id !== payload.user_id && (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin'))) {
      return ResponseFactory.forbidden('Forbidden: You can only delete your own reviews.');
    }
    if (review.status === 'approved' && (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin'))) {
      return ResponseFactory.forbidden('Cannot delete an approved review unless you are admin.');
    }
    await convex.mutation(api.mutations.reviews.deleteReview, { reviewId: review_id });
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to delete review.' );
  }
}

async function handleBulkDelete(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can bulk delete reviews.');
    }
    const { review_ids } = await request.json();
    if (!Array.isArray(review_ids) || review_ids.length === 0) {
      return ResponseFactory.error('review_ids array is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    for (const reviewId of review_ids) {
      await convex.mutation(api.mutations.reviews.deleteReview, { reviewId });
    }
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'bulk_delete_reviews',
      details: { review_ids },
      adminId: payload.user_id,
    });
    return ResponseFactory.success({ success: true, deleted: review_ids.length });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to bulk delete reviews.' );
  }
}

async function handleExport(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles || !Array.isArray(payload.roles) || !payload.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can export reviews.');
    }
    const convex = getConvexClient();
    const allReviews = await convex.query(api.queries.reviews.getAll, {});
    return ResponseFactory.jsonDownload(allReviews, 'reviews-export.json');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to export reviews.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const BULK_DELETE = withAPIMiddleware(withErrorHandling(handleBulkDelete));
export const EXPORT = withAPIMiddleware(withErrorHandling(handleExport)); 