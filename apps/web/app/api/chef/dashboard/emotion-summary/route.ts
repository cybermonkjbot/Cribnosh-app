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
 *       - bearerAuth: []
 */

import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

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
    if (payload.role !== 'chef') {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access this endpoint.');
    }
    const convex = getConvexClient();
    // Get all meals for this chef
    const meals = await convex.query(api.queries.meals.getAll, {}).then((meals: any[]) => meals.filter(m => m.chefId === payload.user_id));
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
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Emotion summary failed.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 