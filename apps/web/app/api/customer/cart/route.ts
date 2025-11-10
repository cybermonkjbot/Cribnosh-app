import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /customer/cart:
 *   get:
 *     summary: Get Customer Cart
 *     description: Get the current customer's shopping cart items
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
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
 *                     cart:
 *                       type: array
 *                       description: Array of cart items
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Cart item ID
 *                             example: "j1234567890abcdef"
 *                           dish_id:
 *                             type: string
 *                             description: Dish ID
 *                             example: "j1234567890abcdef"
 *                           quantity:
 *                             type: number
 *                             description: Quantity of the item
 *                             example: 2
 *                           price:
 *                             type: number
 *                             description: Price per item
 *                             example: 15.99
 *                           total_price:
 *                             type: number
 *                             description: Total price for this item
 *                             example: 31.98
 *                           chef_id:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           dish_name:
 *                             type: string
 *                             description: Name of the dish
 *                             example: "Chicken Tikka Masala"
 *                           chef_name:
 *                             type: string
 *                             description: Name of the chef
 *                             example: "Chef John"
 *                           added_at:
 *                             type: number
 *                             description: Timestamp when item was added
 *                             example: 1640995200000
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
 *         description: Forbidden - only customers can access their cart
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
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    const convex = getConvexClientFromRequest(request);
    // Using orders query to get user's cart
    const cart = await convex.query(api.queries.orders.getUserCart, { userId });
    return ResponseFactory.success({ cart });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch cart.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 