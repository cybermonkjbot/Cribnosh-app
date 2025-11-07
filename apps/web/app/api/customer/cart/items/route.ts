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
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can add cart items.');
    }
    const { dish_id, quantity } = await request.json();
    if (!dish_id || !quantity) {
      return ResponseFactory.validationError('Missing dish_id or quantity.');
    }
    const convex = getConvexClient();
    // Using orders mutation to add item to cart
    const item = await convex.mutation(api.mutations.orders.addToCart, { 
      userId: payload.user_id, 
      item: {
        id: dish_id,
        quantity,
        name: '', // Will be filled by the mutation
        price: 0, // Will be filled by the mutation
      }
    });
    return ResponseFactory.success({ item });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to add cart item.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 