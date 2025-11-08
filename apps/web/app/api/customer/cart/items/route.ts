import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
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
    console.log('[Cart Items API] Authorization header present:', !!authHeader);
    console.log('[Cart Items API] Authorization header starts with Bearer:', authHeader?.startsWith('Bearer '));
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Cart Items API] Missing or invalid Authorization header');
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('[Cart Items API] Token length:', token.length);
    console.log('[Cart Items API] Token (first 20 chars):', token.substring(0, 20));
    
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      console.log('[Cart Items API] JWT verified successfully');
      console.log('[Cart Items API] User ID:', payload.user_id);
      console.log('[Cart Items API] User roles:', payload.roles);
    } catch (error) {
      // Log the specific error for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown JWT error';
      console.error('[Cart Items API] JWT verification failed:', errorMessage);
      console.error('[Cart Items API] Error details:', error);
      console.error('[Cart Items API] Token (first 20 chars):', token.substring(0, 20));
      return ResponseFactory.unauthorized(`Invalid or expired token: ${errorMessage}`);
    }
    
    if (!payload.roles?.includes('customer')) {
      console.error('[Cart Items API] User does not have customer role');
      console.error('[Cart Items API] User roles:', payload.roles);
      console.error('[Cart Items API] User ID:', payload.user_id);
      return ResponseFactory.forbidden('Forbidden: Only customers can add cart items.');
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
        userId: payload.user_id as Id<'users'>, 
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