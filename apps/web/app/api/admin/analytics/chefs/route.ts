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
 * /admin/analytics/chefs:
 *   get:
 *     summary: Get Chef Analytics
 *     description: Retrieve comprehensive analytics data for chefs (admin only)
 *     tags: [Admin, Analytics, Chef]
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: number
 *         description: Start timestamp for date range filter
 *         example: 1640995200000
 *       - in: query
 *         name: end
 *         schema:
 *           type: number
 *         description: End timestamp for date range filter
 *         example: 1641081600000
 *     responses:
 *       200:
 *         description: Chef analytics retrieved successfully
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
 *                     total_chefs:
 *                       type: number
 *                       description: Total number of chefs
 *                       example: 150
 *                     approved_chefs:
 *                       type: number
 *                       description: Number of approved chefs
 *                       example: 120
 *                     pending_chefs:
 *                       type: number
 *                       description: Number of pending chef applications
 *                       example: 25
 *                     active_chefs:
 *                       type: number
 *                       description: Number of currently active chefs
 *                       example: 95
 *                     chef_distribution_by_cuisine:
 *                       type: object
 *                       description: Distribution of chefs by cuisine type
 *                       example:
 *                         italian: 35
 *                         chinese: 28
 *                         indian: 22
 *                         mexican: 18
 *                         japanese: 15
 *                     period:
 *                       type: string
 *                       description: Analysis period
 *                       example: "2024-01-01T00:00:00.000Z - 2024-01-31T23:59:59.999Z"
 *                     chef_locations:
 *                       type: array
 *                       description: Geographic distribution of chefs
 *                       items:
 *                         type: object
 *                         properties:
 *                           chefId:
 *                             type: string
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             example: "Chef Mario"
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
 *                           specialties:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["italian", "pasta"]
 *                           status:
 *                             type: string
 *                             example: "active"
 *                           rating:
 *                             type: number
 *                             example: 4.8
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
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ? Number(searchParams.get('start')) : undefined;
    const end = searchParams.get('end') ? Number(searchParams.get('end')) : undefined;
    const chefs = await convex.query(api.queries.chefs.getAllChefLocations, {});
    // Calculate stats
    const total_chefs = chefs.length;
    const approved_chefs = chefs.filter((c: { status?: string; is_approved?: boolean }) => c.status === 'approved' || c.is_approved).length;
    const pending_chefs = chefs.filter((c: { status?: string; is_approved?: boolean }) => c.status === 'pending' || c.is_approved === false).length;
    const active_chefs = chefs.filter((c: { status?: string }) => c.status === 'active').length;
    // Distribution by cuisine
    const chef_distribution_by_cuisine: Record<string, number> = {};
    chefs.forEach((c: { specialties?: string[] }) => {
      if (c.specialties && Array.isArray(c.specialties)) {
        c.specialties.forEach((cuisine: string) => {
          chef_distribution_by_cuisine[cuisine] = (chef_distribution_by_cuisine[cuisine] || 0) + 1;
        });
      }
    });
    // Period string
    let period = '';
    if (start && end) {
      period = `${new Date(start).toISOString()} - ${new Date(end).toISOString()}`;
    }
    return ResponseFactory.success({
      total_chefs,
      approved_chefs,
      pending_chefs,
      active_chefs,
      chef_distribution_by_cuisine,
      period
    });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch chef analytics.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 