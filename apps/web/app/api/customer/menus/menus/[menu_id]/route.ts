/**
 * @swagger
 * components:
 *   schemas:
 *     MenuResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           description: Menu/meal details
 *         message:
 *           type: string
 *           example: "Success"
 */

import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { extractUserIdFromRequest } from '@/lib/api/userContext';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/customer/menus/menus/{menu_id}
// Group: customer

/**
 * @swagger
 * /api/customer/menus/menus/{menu_id}:
 *   get:
 *     summary: Get menu details
 *     description: Retrieve details of a specific menu/meal item
 *     tags: [Customer Menus]
 *     parameters:
 *       - in: path
 *         name: menu_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the menu/meal item
 *     responses:
 *       200:
 *         description: Menu details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuResponse'
 *       400:
 *         description: Validation error - Missing menu_id
 *       404:
 *         description: Menu not found
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const menu_id = pathParts[pathParts.length - 1];
  
  if (!menu_id) {
    return ResponseFactory.validationError('Missing menu_id');
  }
  
  const convex = getConvexClient();
  
  // Extract userId from request (optional for public endpoints)
  const userId = extractUserIdFromRequest(request);
  
  try {
    // Get all meals with user preferences and find the one with matching ID
    const meals = await convex.query((api as any).queries.meals.getAll, { userId });
    const menu = Array.isArray(meals) ? meals.find(m => m._id === menu_id) : null;
    if (!menu) {
      return ResponseFactory.notFound('Menu not found');
    }
    return ResponseFactory.success(menu);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return ResponseFactory.validationError('Invalid menu_id');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
