import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { sendReviewNotification } from '@/lib/services/email-service';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/orders/{order_id}/rate:
 *   post:
 *     summary: Rate and review an order
 *     description: Submit a rating and review for a delivered order
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to rate
 *         example: "ORD-12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Overall rating (1-5 stars)
 *                 example: 5
 *               review:
 *                 type: string
 *                 nullable: true
 *                 description: Optional review text
 *                 example: "Excellent food quality and timely delivery!"
 *               categories:
 *                 type: object
 *                 nullable: true
 *                 description: Optional category ratings
 *                 properties:
 *                   food_quality:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     example: 5
 *                   delivery_speed:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     example: 4
 *                   packaging:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     example: 5
 *                   customer_service:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     example: 5
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Thank you for your rating!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     review_id:
 *                       type: string
 *                       example: "rev_123456"
 *                     order_id:
 *                       type: string
 *                       example: "ORD-12345"
 *                     rating:
 *                       type: integer
 *                       example: 5
 *                     review:
 *                       type: string
 *                       example: "Excellent food quality and timely delivery!"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Order cannot be rated (already rated, not delivered, etc.)
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Order not found
 *     security:
 *       - bearerAuth: []
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { order_id: string } }
): Promise<NextResponse> {
  try {
    const { order_id } = params;
    
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createSpecErrorResponse(
        'Invalid or missing token',
        'UNAUTHORIZED',
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: { user_id?: string; roles?: string[] };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { user_id?: string; roles?: string[] };
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can rate orders',
        'FORBIDDEN',
        403
      );
    }

    if (!order_id) {
      return createSpecErrorResponse(
        'order_id is required',
        'BAD_REQUEST',
        400
      );
    }

    // Parse and validate request body
    let body: { rating: number; review?: string; categories?: { food_quality?: number; delivery_speed?: number; packaging?: number; customer_service?: number } };
    try {
      body = await request.json() as { rating: number; review?: string; categories?: { food_quality?: number; delivery_speed?: number; packaging?: number; customer_service?: number } };
    } catch {
      return createSpecErrorResponse(
        'Invalid JSON body',
        'BAD_REQUEST',
        400
      );
    }

    const { rating, review, categories } = body;

    // Validation
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return createSpecErrorResponse(
        'rating is required and must be a number between 1 and 5',
        'BAD_REQUEST',
        400
      );
    }

    // Validate categories if provided
    if (categories && typeof categories === 'object') {
      const validCategoryKeys = ['food_quality', 'delivery_speed', 'packaging', 'customer_service'];
      for (const [key, value] of Object.entries(categories)) {
        if (!validCategoryKeys.includes(key)) {
          return createSpecErrorResponse(
            `Invalid category: ${key}. Must be one of: ${validCategoryKeys.join(', ')}`,
            'BAD_REQUEST',
            400
          );
        }
        if (typeof value !== 'number' || value < 1 || value > 5) {
          return createSpecErrorResponse(
            `Category rating ${key} must be a number between 1 and 5`,
            'BAD_REQUEST',
            400
          );
        }
      }
    }

    const convex = getConvexClient();
    const userId = payload.user_id as Id<'users'>;

    // Query order and verify ownership
    const order = await convex.query(api.queries.orders.getById, { order_id });
    if (!order) {
      return createSpecErrorResponse(
        'Order not found',
        'NOT_FOUND',
        404
      );
    }

    const orderData = order as { customer_id?: Id<'users'> | string; order_status?: string; status?: string; chef_id?: Id<'chefs'> | string; _id?: Id<'orders'> };
    
    if (orderData.customer_id !== userId && String(orderData.customer_id) !== String(userId)) {
      return createSpecErrorResponse(
        'Order not found',
        'NOT_FOUND',
        404
      );
    }

    // Check if order can be rated
    const orderStatus = orderData.order_status || orderData.status;
    if (orderStatus !== 'delivered' && orderStatus !== 'completed') {
      return createSpecErrorResponse(
        'Order cannot be rated. Order must be delivered or completed.',
        'BAD_REQUEST',
        400
      );
    }

    // Check if order is already rated
    const allReviews = await convex.query(api.queries.reviews.getAll, {});
    const existingReview = (allReviews as Array<{ order_id?: string; user_id?: string }>).find((r) => 
      r.order_id === orderData._id && r.user_id === userId
    );
    
    if (existingReview) {
      return createSpecErrorResponse(
        'Order has already been rated',
        'BAD_REQUEST',
        400
      );
    }

    // Create review with chef rating update - this consolidates review creation and chef rating update
    const reviewResult = await convex.mutation(api.mutations.reviews.createReviewWithChefRatingUpdate, {
      user_id: userId,
      meal_id: undefined,
      chef_id: orderData.chef_id as Id<'chefs'> | undefined,
      order_id: orderData._id,
      rating,
      comment: review || undefined,
      categories: categories || undefined,
      status: 'approved',
      createdAt: Date.now(),
    });

    const reviewData = {
      review_id: reviewResult.reviewId,
      order_id,
      rating,
      review: review || null,
      created_at: new Date().toISOString(),
    };

    // Send notification to chef about the review
    if (orderData.chef_id) {
      const chef = await convex.query(api.queries.chefs.getChefById, {
        chefId: orderData.chef_id as Id<'chefs'>,
      }).catch(() => null);

      if (chef) {
        const userData = await convex.query(api.queries.users.getById, { userId });
        const customerName = userData?.name || 'A customer';

        // Get chef's user email
        const chefUser = await convex.query(api.queries.users.getById, { userId: chef.userId }).catch(() => null);
        if (chefUser?.email) {
          sendReviewNotification(
            chefUser.email,
            customerName,
            rating,
            review || undefined
          ).catch((error) => {
            console.error('Failed to send review notification:', error);
          });
        }
      }
    }

    return ResponseFactory.success(
      reviewData,
      'Thank you for your rating!'
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit rating';
    return createSpecErrorResponse(
      errorMessage,
      'INTERNAL_ERROR',
      500
    );
  }
}

// Wrapper to extract params from URL
const wrappedHandler = (request: NextRequest) => {
  const url = new URL(request.url);
  const order_id = url.pathname.split('/').pop() || '';
  return handlePOST(request, { params: { order_id } });
};

export const POST = withAPIMiddleware(withErrorHandling(wrappedHandler));

