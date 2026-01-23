import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /admin/logs:
 *   get:
 *     summary: Get System Logs (Admin)
 *     description: Retrieve system logs for administrative monitoring and debugging. This endpoint provides access to application logs, error logs, and system events with pagination support. Only accessible by administrators.
 *     tags: [Admin, System Operations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of log entries to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of log entries to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: System logs retrieved successfully
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
 *                     logs:
 *                       type: array
 *                       description: Array of system log entries
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Log entry ID
 *                             example: "j1234567890abcdef"
 *                           level:
 *                             type: string
 *                             enum: [debug, info, warn, error, fatal]
 *                             description: Log level
 *                             example: "error"
 *                           message:
 *                             type: string
 *                             description: Log message
 *                             example: "Database connection failed"
 *                           timestamp:
 *                             type: number
 *                             description: Log timestamp (Unix timestamp)
 *                             example: 1640995200000
 *                           source:
 *                             type: string
 *                             description: Source component or service
 *                             example: "database"
 *                           userId:
 *                             type: string
 *                             nullable: true
 *                             description: User ID if applicable
 *                             example: "j0987654321fedcba"
 *                           metadata:
 *                             type: object
 *                             additionalProperties: true
 *                             description: Additional log metadata
 *                             example: {"requestId": "req-123", "ip": "192.168.1.1"}
 *                     total:
 *                       type: number
 *                       description: Total number of log entries available
 *                       example: 1500
 *                     limit:
 *                       type: number
 *                       description: Applied limit parameter
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       description: Applied offset parameter
 *                       example: 0
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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);

    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Fetch logs
    interface AdminLog {
      timestamp?: number;
      [key: string]: unknown;
    }
    const allLogs = await convex.query(api.queries.adminLogs.getAll, {
      sessionToken: sessionToken || undefined
    }) as AdminLog[];

    if (!allLogs || !Array.isArray(allLogs)) {
      return ResponseFactory.success({ logs: [], total: 0, limit, offset });
    }

    allLogs.sort((a: AdminLog, b: AdminLog) => (b.timestamp || 0) - (a.timestamp || 0));
    const paginated = allLogs.slice(offset, offset + limit);
    return ResponseFactory.success({ logs: paginated, total: allLogs.length, limit, offset });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 