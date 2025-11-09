import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { ErrorCode, ErrorFactory, withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/reviews/sentiment-batch:
 *   post:
 *     summary: Batch Sentiment Analysis (Admin)
 *     description: Perform sentiment analysis on multiple reviews within a date range using AI models. This endpoint processes reviews and updates them with sentiment data for better insights and moderation.
 *     tags: [Admin, Review Management, AI Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - model
 *               - start_date
 *               - end_date
 *             properties:
 *               model:
 *                 type: string
 *                 description: AI model to use for sentiment analysis
 *                 example: "gpt-4"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Start date for review filtering (YYYY-MM-DD)
 *                 example: "2024-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: End date for review filtering (YYYY-MM-DD)
 *                 example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Sentiment analysis completed successfully
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
 *                     results:
 *                       type: array
 *                       description: Array of sentiment analysis results
 *                       items:
 *                         type: object
 *                         properties:
 *                           score:
 *                             type: number
 *                             minimum: -1
 *                             maximum: 1
 *                             description: Sentiment score (-1 to 1)
 *                             example: 0.85
 *                           label:
 *                             type: string
 *                             enum: [positive, negative, neutral]
 *                             description: Sentiment label
 *                             example: "positive"
 *                           confidence:
 *                             type: number
 *                             minimum: 0
 *                             maximum: 1
 *                             description: Confidence score (0 to 1)
 *                             example: 0.92
 *                           emotions:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Detected emotions
 *                             example: ["joy", "satisfaction"]
 *                     processedCount:
 *                       type: number
 *                       description: Number of reviews processed
 *                       example: 150
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields or invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can perform batch sentiment analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or emotions engine failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

interface Review {
  _id: Id<"reviews">;
  _creationTime: number;
  chefId?: Id<"chefs">;
  mealId?: Id<"meals">;
  comment?: string;
  status: string;
  rating: number;
  userId: Id<"users">;
  createdAt: number;
  // For backward compatibility
  chef_id?: Id<"chefs">;
  meal_id?: Id<"meals">;
  user_id?: Id<"users">;
}

const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const { model, start_date, end_date } = await request.json();
    if (!model || !start_date || !end_date) {
      return ResponseFactory.validationError('model, start_date, and end_date are required.');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    // Type assertion to avoid deep type inference issue
    const queryResult = await convex.query(api.queries.reviews.getAll);
    const allReviews = queryResult as unknown as Review[];
    const reviews = allReviews.filter((r: Review) => {
      const created = new Date(r.createdAt || 0);
      const start = new Date(start_date);
      const end = new Date(end_date);
      return created >= start && created <= end;
    });
    const reviewTexts = reviews
      .map((r: Review) => r.comment)
      .filter((comment: string | undefined): comment is string => typeof comment === 'string' && comment.trim().length > 0);

    if (reviewTexts.length === 0) {
      return ResponseFactory.success({ success: true, message: 'No reviews with valid text found in the date range', results: [] });
    }

    try {
      const res = await fetch(EMOTIONS_ENGINE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          texts: reviewTexts, 
          model, 
          intent: 'batch_sentiment' 
        }),
      });

      if (!res.ok) {
        throw new Error(`Emotions engine responded with status: ${res.status}`);
      }

      const data = await res.json() as { results?: Array<Record<string, unknown>>; error?: string };
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.results || !Array.isArray(data.results)) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Invalid response format from emotions engine');
      }

      // Update reviews with sentiment data if needed
      if (api.mutations.reviews.updateReview) {
        await Promise.all(
          reviews.map(async (review: Review, index: number) => {
            if (review.comment && data.results?.[index]) {
              try {
                await convex.mutation(api.mutations.reviews.updateReview, { 
                  reviewId: review._id, 
                  sentiment: data.results[index],
                  analyzedAt: Date.now(),
                  sessionToken: sessionToken || undefined
                });
              } catch (error) {
                logger.error(`Failed to update review ${review._id}:`, error);
              }
            }
          })
        );
      }

      return ResponseFactory.success({ 
        success: true, 
        results: data.results,
        processedCount: reviews.length
      });
    } catch (error: unknown) {
      if (isAuthenticationError(error) || isAuthorizationError(error)) {
        return handleConvexError(error, request);
      }
      return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
    }
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 