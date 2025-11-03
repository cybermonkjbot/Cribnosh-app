import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

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
 *       - bearerAuth: []
 */

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    interface JWTPayload {
      role?: string;
      userId?: string;
      user_id?: string;
      email?: string;
      [key: string]: unknown;
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can access logs.');
    }
    const convex = getConvexClient();
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
    const allLogs = await convex.query(api.queries.adminLogs.getAll, {}) as AdminLog[];
    allLogs.sort((a: AdminLog, b: AdminLog) => (b.timestamp || 0) - (a.timestamp || 0));
    const paginated = allLogs.slice(offset, offset + limit);
    return ResponseFactory.success({ logs: paginated, total: allLogs.length, limit, offset });
  } catch (error: unknown) {
    return ResponseFactory.internalError(error instanceof Error ? error.message : 'Failed to fetch logs.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 