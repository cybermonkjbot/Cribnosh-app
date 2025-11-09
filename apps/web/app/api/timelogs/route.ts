import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '../../../lib/api/middleware';
import { getConvexClientFromRequest, api, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

type ActivityWatchLog = {
  timestamp: string;
  duration: number;
  data: Record<string, any>;
};

type TimelogRequest = {
  user: string;
  bucket: string;
  logs: ActivityWatchLog[];
};

function isValidLog(log: any): log is ActivityWatchLog {
  return (
    typeof log === 'object' &&
    typeof log.timestamp === 'string' &&
    typeof log.duration === 'number' &&
    typeof log.data === 'object'
  );
}

function validateTimelogRequest(data: any): data is TimelogRequest {
  return (
    data &&
    typeof data.user === 'string' &&
    typeof data.bucket === 'string' &&
    Array.isArray(data.logs) &&
    data.logs.every(isValidLog)
  );
}

/**
 * @swagger
 * /timelogs:
 *   post:
 *     summary: Create timelog
 *     description: Create a new timelog entry with activity watch logs
 *     tags: [Timelogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - bucket
 *               - logs
 *             properties:
 *               user:
 *                 type: string
 *                 description: Username or email of the staff member
 *                 example: "john.doe@example.com"
 *               bucket:
 *                 type: string
 *                 description: Bucket name for the timelog
 *                 example: "work"
 *               logs:
 *                 type: array
 *                 description: Array of activity watch logs
 *                 items:
 *                   type: object
 *                   required:
 *                     - timestamp
 *                     - duration
 *                     - data
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       description: ISO timestamp of the activity
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     duration:
 *                       type: number
 *                       description: Duration of the activity in seconds
 *                       example: 3600
 *                     data:
 *                       type: object
 *                       description: Additional activity data
 *                       example: {"app": "vscode", "title": "coding"}
 *     responses:
 *       200:
 *         description: Timelog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Staff member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 *       - cookieAuth: []
 */
async function postHandler(req: NextRequest) {
  try {
    const data = await req.json();
    if (!validateTimelogRequest(data)) {
      return ResponseFactory.badRequest("Validation error");
    }
    const convex = getConvexClientFromRequest(req)
    const sessionToken = getSessionTokenFromRequest(req);;
    const staff = await convex.query(api.queries.users.getUserByNameOrEmail, {
      identifier: data.user,
      sessionToken: sessionToken || undefined
    });
    if (!staff) {
      return ResponseFactory.notFound("Resource not found");
    }
    const result = await convex.mutation(api.mutations.timelogs.createTimelog, {
      user: data.user,
      staffId: staff._id,
      bucket: data.bucket,
      logs: data.logs,
      timestamp: Date.now(),
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    return ResponseFactory.badRequest("Validation error");
  }
}

export const POST = withAPIMiddleware(postHandler, { enableRateLimit: false, enableSecurity: true });

export function OPTIONS() {
  return ResponseFactory.options(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], ['Content-Type', 'Authorization', 'X-Requested-With'], 204);
}

/**
 * @swagger
 * /timelogs:
 *   get:
 *     summary: Get timelogs
 *     description: Retrieve timelogs with optional filtering by staff, bucket, and date range
 *     tags: [Timelogs]
 *     parameters:
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff member ID
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *         description: Filter by bucket name
 *         example: "work"
 *       - in: query
 *         name: start
 *         schema:
 *           type: number
 *         description: Start timestamp filter
 *         example: 1640995200000
 *       - in: query
 *         name: end
 *         schema:
 *           type: number
 *         description: End timestamp filter
 *         example: 1641081600000
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *         description: Number of records to skip
 *         example: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Maximum number of records to return
 *         example: 50
 *     responses:
 *       200:
 *         description: Timelogs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 *       - cookieAuth: []
 */
export async function GET(req: NextRequest) {
  try {
    const convex = getConvexClientFromRequest(req);
    const sessionToken = getSessionTokenFromRequest(req);
    const { searchParams } = new URL(req.url);
    const staffIdParam = searchParams.get('staffId');
    const staffId = staffIdParam ? staffIdParam as Id<'users'> : undefined;
    const bucket = searchParams.get('bucket') || undefined;
    const start = searchParams.get('start') ? Number(searchParams.get('start')) : undefined;
    const end = searchParams.get('end') ? Number(searchParams.get('end')) : undefined;
    const skip = searchParams.get('skip') ? Number(searchParams.get('skip')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const result = await convex.query(api.queries.timelogs.getTimelogs, {
      staffId,
      bucket,
      start,
      end,
      skip,
      limit,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    return ResponseFactory.badRequest("Validation error");
  }
}

async function putHandler(req: NextRequest) {
  try {
    const data = await req.json();
    const { searchParams } = new URL(req.url);
    const timelogId = searchParams.get('id');
    
    if (!timelogId) {
      return ResponseFactory.badRequest("Timelog ID is required");
    }
    
    if (!validateTimelogRequest(data)) {
      return ResponseFactory.badRequest("Validation error");
    }
    
    const convex = getConvexClientFromRequest(req);
    const sessionToken = getSessionTokenFromRequest(req);
    const staff = await convex.query(api.queries.users.getUserByNameOrEmail, {
      identifier: data.user,
      sessionToken: sessionToken || undefined
    });
    if (!staff) {
      return ResponseFactory.notFound("Resource not found");
    }
    
    const result = await convex.mutation(api.mutations.timelogs.updateTimelog, {
      timelogId: timelogId as Id<'timelogs'>,
      user: data.user,
      staffId: staff._id,
      bucket: data.bucket,
      logs: data.logs,
      timestamp: Date.now(),
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    return ResponseFactory.badRequest("Validation error");
  }
}

async function deleteHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timelogId = searchParams.get('id');
    
    if (!timelogId) {
      return ResponseFactory.badRequest("Timelog ID is required");
    }
    
    const convex = getConvexClientFromRequest(req);
    const sessionToken = getSessionTokenFromRequest(req);
    const result = await convex.mutation(api.mutations.timelogs.deleteTimelog, {
      timelogId: timelogId as Id<'timelogs'>,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    return ResponseFactory.badRequest("Validation error");
  }
}

async function patchHandler(req: NextRequest) {
  try {
    const data = await req.json();
    const { searchParams } = new URL(req.url);
    const timelogId = searchParams.get('id');
    
    if (!timelogId) {
      return ResponseFactory.badRequest("Timelog ID is required");
    }
    
    const convex = getConvexClientFromRequest(req);
    const sessionToken = getSessionTokenFromRequest(req);
    const result = await convex.mutation(api.mutations.timelogs.patchTimelog, {
      timelogId: timelogId as Id<'timelogs'>,
      updates: data,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, req);
    }
    return ResponseFactory.badRequest("Validation error");
  }
}

export const PUT = withAPIMiddleware(putHandler, { enableRateLimit: false, enableSecurity: true });
export const DELETE = withAPIMiddleware(deleteHandler, { enableRateLimit: false, enableSecurity: true });
export const PATCH = withAPIMiddleware(patchHandler, { enableRateLimit: false, enableSecurity: true }); 