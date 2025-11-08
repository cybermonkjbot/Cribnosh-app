/**
 * @swagger
 * /api/chef/dashboard/emotion-summary:
 *   get:
 *     summary: Get chef emotion summary
 *     description: Retrieve AI-powered emotion analysis summary of all reviews for the chef's meals
 *     tags: [Chef - Dashboard]
 *     responses:
 *       200:
 *         description: Emotion summary retrieved successfully
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
 *                     data:
 *                       type: object
 *                       description: Emotion analysis data from AI engine
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Chef access required
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */

import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);
    const convex = getConvexClient();
    // Get all meals for this chef
    const meals = await convex.query(api.queries.meals.getAll, {}).then((meals: any[]) => meals.filter(m => m.chefId === userId));
    // Get all reviews for these meals
    const reviews = await convex.query(api.queries.reviews.getAll, {}).then((reviews: any[]) => reviews.filter(r => meals.some(m => m._id === r.meal_id)));
    // Aggregate review texts
    const reviewTexts = reviews.map(r => r.comment || r.text).filter(Boolean);
    const res = await fetch(EMOTIONS_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: reviewTexts, intent: 'chef_emotion_summary' }),
    });
    const data = await res.json();
    return ResponseFactory.success({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 