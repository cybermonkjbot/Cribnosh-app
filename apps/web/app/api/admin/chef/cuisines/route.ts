import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/chef/cuisines:
 *   get:
 *     summary: Get All Chef Cuisines
 *     description: Retrieve all cuisine types available from chefs (admin only)
 *     tags: [Admin, Chef, Cuisines]
 *     responses:
 *       200:
 *         description: Chef cuisines retrieved successfully
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
 *                       description: Array of cuisine types
 *                       items:
 *                         type: object
 *                         properties:
 *                           cuisine:
 *                             type: string
 *                             description: Cuisine type name
 *                             example: "italian"
 *                           count:
 *                             type: number
 *                             description: Number of chefs offering this cuisine
 *                             example: 25
 *                           chefs:
 *                             type: array
 *                             description: List of chefs offering this cuisine
 *                             items:
 *                               type: object
 *                               properties:
 *                                 chefId:
 *                                   type: string
 *                                   example: "j1234567890abcdef"
 *                                 name:
 *                                   type: string
 *                                   example: "Chef Mario"
 *                                 rating:
 *                                   type: number
 *                                   example: 4.8
 *                                 location:
 *                                   type: object
 *                                   properties:
 *                                     city:
 *                                       type: string
 *                                       example: "London"
 *                                     coordinates:
 *                                       type: array
 *                                       items:
 *                                         type: number
 *                                       example: [-0.1276, 51.5074]
 *                           total_dishes:
 *                             type: number
 *                             description: Total dishes in this cuisine
 *                             example: 150
 *                           average_price:
 *                             type: number
 *                             description: Average price for dishes in this cuisine
 *                             example: 18.50
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
  const convex = getConvexClient();
  const cuisines = await convex.query(api.queries.chefs.listAllCuisines, {});
  return ResponseFactory.success({ cuisines });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 