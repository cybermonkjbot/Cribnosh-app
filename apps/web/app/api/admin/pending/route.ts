import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /admin/pending:
 *   get:
 *     summary: Get Pending Items (Admin)
 *     description: Retrieve all pending items requiring admin approval including users, chefs, and dishes
 *     tags: [Admin, Pending Items]
 *     responses:
 *       200:
 *         description: Pending items retrieved successfully
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
 *                     pendingUsers:
 *                       type: array
 *                       description: Array of users with pending status
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: User ID
 *                             example: "j1234567890abcdef"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "user@example.com"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                           roles:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["customer"]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                     pendingChefs:
 *                       type: array
 *                       description: Array of chefs with pending approval
 *                       items:
 *                         type: object
 *                         properties:
 *                           chefId:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           userId:
 *                             type: string
 *                             description: User ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             example: "Chef Mario"
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                           specialties:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["italian", "pasta"]
 *                           location:
 *                             type: object
 *                             properties:
 *                               coordinates:
 *                                 type: array
 *                                 items:
 *                                   type: number
 *                                 example: [-0.1276, 51.5074]
 *                               address:
 *                                 type: string
 *                                 example: "123 Baker Street, London"
 *                           rating:
 *                             type: number
 *                             example: 0
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                     pendingDishes:
 *                       type: array
 *                       description: Array of dishes pending approval
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Dish ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             example: "Spaghetti Carbonara"
 *                           description:
 *                             type: string
 *                             example: "Classic Italian pasta dish"
 *                           price:
 *                             type: number
 *                             example: 15.99
 *                           chefId:
 *                             type: string
 *                             description: Chef ID who created the dish
 *                             example: "j1234567890abcdef"
 *                           cuisine:
 *                             type: string
 *                             example: "italian"
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: "https://example.com/dish-image.jpg"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
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
 *         description: Forbidden - only admins can access this endpoint
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
    if (!payload.roles?.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    const pendingUsers = await convex.query(api.queries.users.getUsersByStatus, { status: 'pending' });
    const allChefs = await convex.query(api.queries.chefs.getAllChefLocations, {});
    const pendingChefs = allChefs.filter((c: { status?: string }) => c.status === 'pending');
    const pendingDishes = await convex.query(api.queries.meals.getPending, {});
    return ResponseFactory.success({
      pendingUsers,
      pendingChefs,
      pendingDishes,
    });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch pending items.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 