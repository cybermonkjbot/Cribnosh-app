import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    const sessionToken = request.cookies.get('convex-auth-token')?.value;
    
    console.log('[Cart GET] Auth header present:', !!authHeader);
    console.log('[Cart GET] Cookie header present:', !!cookieHeader);
    console.log('[Cart GET] Session token from cookies:', !!sessionToken);
    
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      let payload: JWTPayload;
      try {
        payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      } catch {
        return ResponseFactory.unauthorized('Invalid or expired token.');
      }
      
      if (!payload.roles?.includes('customer')) {
        return ResponseFactory.forbidden('Forbidden: Only customers can access their cart.');
      }
      
      if (!payload.user_id) {
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
    
    const convex = getConvexClient();
    const cart = await convex.query(api.queries.orders.getUserCart, { userId });
    return ResponseFactory.success({ cart });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch cart.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 