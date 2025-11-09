/**
 * @swagger
 * components:
 *   schemas:
 *     ChromeActivityLog:
 *       type: object
 *       required:
 *         - url
 *         - title
 *         - start
 *         - end
 *         - idleState
 *       properties:
 *         url:
 *           type: string
 *           description: URL visited
 *         title:
 *           type: string
 *           description: Page title
 *         start:
 *           type: number
 *           description: Start timestamp
 *         end:
 *           type: number
 *           description: End timestamp
 *         idleState:
 *           type: string
 *           description: User idle state
 *     ChromeActivityRequest:
 *       type: object
 *       required:
 *         - user
 *         - logs
 *       properties:
 *         user:
 *           type: string
 *           description: User identifier
 *         logs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ChromeActivityLog'
 *         bucket:
 *           type: string
 *           description: Activity bucket name
 *         batchId:
 *           type: string
 *           description: Batch identifier for deduplication
 */

import { api, getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

// Chrome Activity Log type
interface ChromeActivityLog {
  url: string;
  title: string;
  start: number;
  end: number;
  idleState: string;
}

interface ChromeActivityRequest {
  user: string;
  logs: ChromeActivityLog[];
  bucket?: string;
  batchId?: string;
}

// In-memory deduplication store for development
const processedBatchIds = new Set<string>();
const isProd = process.env.NODE_ENV === 'production';

function isValidChromeLog(log: any): log is ChromeActivityLog {
  return (
    typeof log === 'object' &&
    typeof log.url === 'string' &&
    typeof log.title === 'string' &&
    typeof log.start === 'number' &&
    typeof log.end === 'number' &&
    typeof log.idleState === 'string'
  );
}

function validateChromeActivityRequest(data: any): data is ChromeActivityRequest {
  return (
    data &&
    typeof data.user === 'string' &&
    Array.isArray(data.logs) &&
    data.logs.every(isValidChromeLog)
  );
}

/**
 * @swagger
 * /api/timelogs/activity-tracker:
 *   post:
 *     summary: Track Chrome activity
 *     description: Submit Chrome browser activity logs for time tracking
 *     tags: [Timelogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChromeActivityRequest'
 *     responses:
 *       200:
 *         description: Activity logged successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Invalid request data
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *     security: []
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!validateChromeActivityRequest(data)) {
      return ResponseFactory.badRequest("Validation error");
    }
    const batchId = data.batchId;
    const convex = getConvexClientFromRequest(req)
    const sessionToken = getSessionTokenFromRequest(req);;
    
    // Get staff user first
    const staff = await convex.query(api.queries.users.getUserByNameOrEmail, {
      identifier: data.user,
      sessionToken: sessionToken || undefined
    });
    if (!staff) {
      return ResponseFactory.notFound("Resource not found");
    }
    
    // Deduplication: check batchId in logs data
    if (batchId) {
      if (isProd) {
        // Check for existing logs with this batchId in the logs data
        const existingLogs = await convex.query(api.queries.timelogs.getTimelogs, {
          staffId: staff._id,
          bucket: data.bucket || 'chrome-activity',
          sessionToken: sessionToken || undefined
        });
        
        const hasExistingBatch = existingLogs.results.some((log: { logs: Array<{ data?: { batchId?: string } }> }) => 
          log.logs.some((l) => l.data?.batchId === batchId)
        );
        
        if (hasExistingBatch) {
          return ResponseFactory.success({});
        }
      } else {
        // Dev fallback: in-memory
        if (processedBatchIds.has(batchId)) {
          return ResponseFactory.success({});
        }
      }
    }

    // Transform logs to generic format for storage
    const logs = data.logs.map((log: ChromeActivityLog) => ({
      timestamp: new Date(log.start).toISOString(),
      duration: (log.end - log.start) / 1000, // seconds
      data: {
        url: log.url,
        title: log.title,
        idleState: log.idleState,
        batchId: batchId || null,
      },
    }));
    // Store timelog with batchId in the logs data
    const result = await convex.mutation(api.mutations.timelogs.createTimelog, {
      user: data.user,
      staffId: staff._id,
      bucket: data.bucket || 'chrome-activity',
      logs: logs.map(log => ({
        ...log,
        data: {
          ...log.data,
          batchId: batchId || null
        }
      })),
      timestamp: Date.now(),
      sessionToken: sessionToken || undefined
    });
    
    if (batchId && !isProd) {
      // In development, track processed batch IDs in memory
      processedBatchIds.add(batchId);
    }
    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    return ResponseFactory.badRequest("Validation error");
  }
}

export function OPTIONS() {
  return ResponseFactory.options(['POST', 'OPTIONS'], ['Content-Type', 'Authorization', 'X-Requested-With'], 204);
} 