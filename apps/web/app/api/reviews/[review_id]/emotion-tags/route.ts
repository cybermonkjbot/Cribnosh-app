/**
 * @swagger
 * components:
 *   schemas:
 *     EmotionTagsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               description: Emotion tags extracted from the review
 *             emotion:
 *               type: string
 *               description: Primary emotion detected
 *             recommendation:
 *               type: string
 *               description: Recommendation based on emotion analysis
 *             summary:
 *               type: string
 *               description: Summary of the emotion analysis
 *         message:
 *           type: string
 *           example: "Success"
 */

import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, api } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

/**
 * @swagger
 * /api/reviews/{review_id}/emotion-tags:
 *   get:
 *     summary: Get emotion tags for a review
 *     description: Analyze a review and extract emotion tags using AI
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review to analyze
 *       - in: query
 *         name: review_id
 *         schema:
 *           type: string
 *         description: Alternative way to specify review ID
 *     responses:
 *       200:
 *         description: Emotion tags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmotionTagsResponse'
 *       400:
 *         description: Validation error - Missing review_id
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error or emotion tagging failed
 *     security: []
 */
async function handleGET(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const review_id = searchParams.get('review_id');
    
    if (!review_id) {
      return ResponseFactory.validationError('Missing review_id');
    }
    
    const convex = getConvexClientFromRequest(request);
    const review = await convex.query(api.queries.reviews.get, { id: review_id as Id<'reviews'> });
    
    if (!review) {
      return ResponseFactory.notFound('Review not found.');
    }
    
    const res = await fetch(EMOTIONS_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: review.comment || '', 
        intent: 'emotion_tags' 
      }),
    });
    
    if (!res.ok) {
      throw new Error(`Emotions engine request failed with status ${res.status}`);
    }
    
    const data = await res.json();
    return ResponseFactory.success({
      success: true,
      tags: data.tags || [],
      emotion: data.emotion || '',
      recommendation: data.recommendation || '',
      summary: data.summary || '',
    });
  } catch (error: any) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error in emotion-tags API:', error);
    return ResponseFactory.internalError(error.message || 'Emotion tagging failed.' );
  }
}

// Wrap the handler with middleware
export const GET = withAPIMiddleware(
  withErrorHandling(handleGET) as (request: NextRequest) => Promise<NextResponse>
);