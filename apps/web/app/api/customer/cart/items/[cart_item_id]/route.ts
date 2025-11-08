import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

// Helper function to handle route parameters
type RouteParams = {
  params: {
    cart_item_id: string;
  };
};

// Handler functions are now inlined in the route handlers

// Create a higher-order function to handle route parameters
const withCartItemId = (handler: (req: NextRequest, cartItemId: string) => Promise<NextResponse>) => {
  return async (request: NextRequest) => {
    const cart_item_id = new URL(request.url).pathname.split('/').pop() || '';
    return handler(request, cart_item_id);
  };
};

/**
 * @swagger
 * /customer/cart/items/{cart_item_id}:
 *   put:
 *     summary: Update Cart Item Quantity
 *     description: Update the quantity of a specific item in the customer's cart
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: cart_item_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item to update
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: New quantity for the cart item
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart item updated successfully
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
 *                       description: Updated cart item
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         dish_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         quantity:
 *                           type: number
 *                           example: 3
 *                         price:
 *                           type: number
 *                           example: 15.99
 *                         name:
 *                           type: string
 *                           example: "Chicken Tikka Masala"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing quantity
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
 *         description: Forbidden - only customers can update cart items
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
// Wrap handlers with proper route parameter handling
export const PUT = withAPIMiddleware(
  withErrorHandling(
    withCartItemId(async (request, cart_item_id) => {
      try {
        const { userId } = await getAuthenticatedCustomer(request);
        const { quantity } = await request.json();
        if (!quantity) {
          return ResponseFactory.validationError('Missing quantity.');
        }
        
        const convex = getConvexClientFromRequest(request);
        const item = await convex.mutation(api.mutations.orders.updateCartItem, {
          userId,
          itemId: cart_item_id,
          quantity,
        });
        
        return ResponseFactory.success({ item });
      } catch (error: unknown) {
        if (isAuthenticationError(error) || isAuthorizationError(error)) {
          return handleConvexError(error, request);
        }
        throw error;
      }
    })
  )
);

/**
 * @swagger
 * /customer/cart/items/{cart_item_id}:
 *   delete:
 *     summary: Remove Cart Item
 *     description: Remove a specific item from the customer's cart
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: cart_item_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cart item to remove
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Cart item removed successfully
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
 *         description: Forbidden - only customers can remove cart items
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
export const DELETE = withAPIMiddleware(
  withErrorHandling(
    withCartItemId(async (request, cart_item_id) => {
      try {
        const { userId } = await getAuthenticatedCustomer(request);
        
        const convex = getConvexClientFromRequest(request);
        const success = await convex.mutation(api.mutations.orders.removeFromCart, {
          userId,
          itemId: cart_item_id,
        });
        
        return ResponseFactory.success({ success });
      } catch (error: unknown) {
        if (isAuthenticationError(error) || isAuthorizationError(error)) {
          return handleConvexError(error, request);
        }
        throw error;
      }
    })
  )
);
