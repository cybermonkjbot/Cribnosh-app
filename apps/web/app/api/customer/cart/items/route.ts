import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import type { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/cart/items:
 *   post:
 *     summary: Add Item to Cart
 *     description: Add a dish item to the customer's shopping cart
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dish_id
 *               - quantity
 *             properties:
 *               dish_id:
 *                 type: string
 *                 description: ID of the dish to add
 *                 example: "j1234567890abcdef"
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Quantity of the dish
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added to cart successfully
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
 *                     item:
 *                       type: object
 *                       description: Added cart item with details
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Cart item ID
 *                           example: "j1234567890abcdef"
 *                         dish_id:
 *                           type: string
 *                           description: Dish ID
 *                           example: "j1234567890abcdef"
 *                         quantity:
 *                           type: number
 *                           example: 2
 *                         price:
 *                           type: number
 *                           description: Price per item
 *                           example: 15.99
 *                         name:
 *                           type: string
 *                           description: Dish name
 *                           example: "Chicken Tikka Masala"
 *                         chef_id:
 *                           type: string
 *                           description: Chef ID
 *                           example: "j1234567890abcdef"
 *                         added_at:
 *                           type: number
 *                           description: Timestamp when item was added
 *                           example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
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
 *         description: Forbidden - only customers can add cart items
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
    const cookieHeader = request.headers.get('cookie');
    const sessionToken = request.cookies.get('convex-auth-token')?.value;
    
    console.log('[Cart POST] Auth header present:', !!authHeader);
    console.log('[Cart POST] Cookie header present:', !!cookieHeader);
    console.log('[Cart POST] Session token from cookies:', !!sessionToken);
    
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      let payload: JWTPayload;
      try {
        payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      } catch (error) {
        console.error('[Cart POST] JWT verification failed:', error);
        return ResponseFactory.unauthorized('Invalid or expired token.');
      }
      
      if (!payload.roles?.includes('customer')) {
        console.error('[Cart POST] User missing customer role:', payload.roles);
        return ResponseFactory.forbidden('Forbidden: Only customers can add cart items.');
      }
      
      if (!payload.user_id) {
        console.error('[Cart POST] JWT payload missing user_id');
        return ResponseFactory.unauthorized('Invalid token: missing user_id.');
      }
      
      userId = payload.user_id;
    } else {
      // Fallback: try to get session token from cookies
      const sessionToken = request.cookies.get('convex-auth-token')?.value;
      if (!sessionToken) {
        return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
      }
      
      const convex = getConvexClient();
      // @ts-ignore - Type instantiation is excessively deep due to Convex type inference
      const user = await convex.query(api.queries.users.getUserBySessionToken, { 
        sessionToken 
      });
      
      if (!user) {
        return ResponseFactory.unauthorized('Invalid or expired session token.');
      }
      
      if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
        return ResponseFactory.unauthorized('Session token has expired.');
      }
      
      let userRoles = user.roles || ['user'];
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        await convex.mutation(api.mutations.users.updateUserRoles, {
          userId: user._id,
          roles: userRoles,
        });
      }
      
      userId = user._id;
    }
    
    const { dish_id, quantity } = await request.json();
    if (!dish_id || !quantity) {
      return ResponseFactory.validationError('Missing dish_id or quantity.');
    }
    if (quantity <= 0) {
      return ResponseFactory.validationError('Quantity must be greater than 0.');
    }
    
    const convex = getConvexClient();
    
    // Using orders mutation to add item to cart (mutation fetches meal details internally)
    try {
      const item = await convex.mutation(api.mutations.orders.addToCart, { 
        userId: userId as Id<'users'>, 
        dishId: dish_id as Id<'meals'>,
        quantity,
      });
      return ResponseFactory.success({ item });
    } catch (mutationError: unknown) {
      const errorMessage = getErrorMessage(mutationError, 'Failed to add cart item.');
      // Handle specific error messages from mutation
      if (errorMessage.includes('not found')) {
        return ResponseFactory.notFound('Dish not found.');
      }
      if (errorMessage.includes('unavailable')) {
        return ResponseFactory.validationError('This dish is currently unavailable.');
      }
      // Re-throw to be caught by outer handler
      throw mutationError;
    }
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to add cart item.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 