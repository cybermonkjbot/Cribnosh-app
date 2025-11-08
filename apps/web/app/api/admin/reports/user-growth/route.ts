import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
/**
 * @swagger
 * /admin/reports/user-growth:
 *   get:
 *     summary: Get User Growth Report (Admin)
 *     description: Retrieve user growth analytics showing daily signup trends over the last 7 days. This endpoint provides insights into user acquisition patterns and growth metrics for administrative reporting.
 *     tags: [Admin, Analytics, Reports]
 *     responses:
 *       200:
 *         description: User growth report retrieved successfully
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
 *                     labels:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date
 *                       description: Array of date labels for the last 7 days (YYYY-MM-DD format)
 *                       example: ["2024-01-09", "2024-01-10", "2024-01-11", "2024-01-12", "2024-01-13", "2024-01-14", "2024-01-15"]
 *                     signups:
 *                       type: array
 *                       items:
 *                         type: number
 *                       description: Array of daily signup counts corresponding to the labels
 *                       example: [5, 8, 12, 7, 15, 9, 11]
 *                     total:
 *                       type: number
 *                       description: Total number of users in the system
 *                       example: 1250
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when the report was generated
 *                       example: "2024-01-15T14:30:00Z"
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
 *         description: Forbidden - admin access required
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
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const convex = getConvexClient();
    const users = await convex.query(api.queries.users.getAllUsers, {});
    // Group by signup date (_creationTime)
    const now = new Date();
    const days = 7;
    const labels: string[] = [];
    const signups: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const label = day.toISOString().slice(0, 10);
      labels.push(label);
      signups.push(users.filter((u: { _creationTime?: number }) => {
        if (!u._creationTime) return false;
        const created = new Date(u._creationTime);
        return created.toISOString().slice(0, 10) === label;
      }).length);
    }
    const report = {
      labels,
      signups,
      total: users.length,
      generatedAt: new Date().toISOString(),
    };
    return ResponseFactory.success(report);
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 