import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withCaching } from '@/lib/api/cache';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Type definition for meal data structure
interface MealData {
  cuisine?: string[];
  [key: string]: unknown;
}

/**
 * @swagger
 * /customer/cuisines:
 *   get:
 *     summary: Get Available Cuisines
 *     description: Get a list of all available cuisines from the meals database
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Cuisines retrieved successfully
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
 *                     cuisines:
 *                       type: array
 *                       description: Array of available cuisines
 *                       items:
 *                         type: string
 *                       example: ["Italian", "Indian", "Chinese", "Mexican", "Mediterranean"]
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
  
  // Use optimized query that only gets unique cuisines without loading all meals
  const cuisines = await convex.query(api.queries.meals.getCuisines, {});
  
  const response = ResponseFactory.success({ cuisines });
  
  // Add cache headers - cuisines don't change frequently, cache for 1 hour
  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
  response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600');
  
  return response;
}

export const GET = withAPIMiddleware(withErrorHandling(withCaching(handleGET, { ttl: 3600 })));

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  return ResponseFactory.error('Method not allowed', 'CUSTOM_ERROR', 405);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 