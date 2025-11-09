import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { sendSupportCaseNotification } from '@/lib/services/email-service';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * @swagger
 * /customer/support-cases:
 *   get:
 *     summary: Get customer's support cases
 *     description: Get paginated list of support cases for the customer
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, resolved]
 *         description: Filter by status
 *         example: "open"
 *     responses:
 *       200:
 *         description: Support cases retrieved successfully
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
 *                     cases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "case_123456"
 *                           subject:
 *                             type: string
 *                             example: "Order delivery issue"
 *                           status:
 *                             type: string
 *                             enum: [open, closed, resolved]
 *                             example: "open"
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high]
 *                             example: "high"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-14T10:30:00Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T09:00:00Z"
 *                           last_message:
 *                             type: string
 *                             example: "We're looking into your delivery issue..."
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 5
 *                         total_pages:
 *                           type: integer
 *                           example: 1
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    if (limit < 1) limit = DEFAULT_LIMIT;
    const status = searchParams.get('status'); // optional filter

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Query support cases from database
    const allCases = await convex.query(api.queries.supportCases.getByUserId, {
      userId,
      status: status as 'open' | 'closed' | 'resolved' | undefined,
      sessionToken: sessionToken || undefined
    });

    // Pagination
    const total = allCases.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCases = allCases.slice(offset, offset + limit);

    // Format cases for response
    const formattedCases = paginatedCases.map((c: { _id: string; subject: string; status: string; priority: string; created_at: number; updated_at: number; last_message?: string; message?: string }) => ({
      id: c._id,
      subject: c.subject,
      status: c.status,
      priority: c.priority,
      created_at: new Date(c.created_at).toISOString(),
      updated_at: new Date(c.updated_at).toISOString(),
      last_message: c.last_message || c.message,
    }));

    return ResponseFactory.success({
      cases: formattedCases,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch support cases'),
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * @swagger
 * /customer/support-cases:
 *   post:
 *     summary: Create a new support case
 *     description: Create a new support case for customer service
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *               - category
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Order delivery issue"
 *               message:
 *                 type: string
 *                 example: "My order was supposed to arrive yesterday but I haven't received it yet."
 *               category:
 *                 type: string
 *                 enum: [order, payment, account, technical, other]
 *                 example: "order"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: "medium"
 *                 example: "high"
 *               order_id:
 *                 type: string
 *                 nullable: true
 *                 example: "ORD-12345"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *     responses:
 *       200:
 *         description: Support case created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support case created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "case_123458"
 *                     subject:
 *                       type: string
 *                       example: "Order delivery issue"
 *                     status:
 *                       type: string
 *                       example: "open"
 *                     priority:
 *                       type: string
 *                       example: "high"
 *                     category:
 *                       type: string
 *                       example: "order"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     support_reference:
 *                       type: string
 *                       example: "SUP-2024-001234"
 *       400:
 *         description: Invalid case data or validation error
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    // Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return createSpecErrorResponse(
        'Invalid JSON body',
        'BAD_REQUEST',
        400
      );
    }

    const { subject, message, category, priority = 'medium', order_id, attachments = [] } = body;

    // Validation
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return createSpecErrorResponse(
        'subject is required and must be a non-empty string',
        'BAD_REQUEST',
        400
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return createSpecErrorResponse(
        'message is required and must be a non-empty string',
        'BAD_REQUEST',
        400
      );
    }

    if (!category || typeof category !== 'string' || !['order', 'payment', 'account', 'technical', 'other'].includes(category)) {
      return createSpecErrorResponse(
        'category is required and must be one of: order, payment, account, technical, other',
        'BAD_REQUEST',
        400
      );
    }

    if (typeof priority !== 'string' || !['low', 'medium', 'high'].includes(priority)) {
      return createSpecErrorResponse(
        'priority must be one of: low, medium, high',
        'BAD_REQUEST',
        400
      );
    }

    if (!Array.isArray(attachments)) {
      return createSpecErrorResponse(
        'attachments must be an array',
        'BAD_REQUEST',
        400
      );
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Create support case in database
    const caseId = await convex.mutation(api.mutations.supportCases.create, {
      userId,
      subject,
      message,
      category: category as 'order' | 'payment' | 'account' | 'technical' | 'other',
      priority: priority as 'low' | 'medium' | 'high',
      order_id,
      attachments,
      sessionToken: sessionToken || undefined
    });

    // Get created case
    const cases = await convex.query(api.queries.supportCases.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined
    });
    const supportCase = cases.find((c: { _id: string }) => c._id === caseId);

    if (!supportCase) {
      return createSpecErrorResponse(
        'Failed to create support case',
        'INTERNAL_ERROR',
        500
      );
    }

    const formattedCase = {
      id: supportCase._id,
      subject: supportCase.subject,
      status: supportCase.status,
      priority: supportCase.priority,
      category: supportCase.category,
      created_at: new Date(supportCase.created_at).toISOString(),
      support_reference: supportCase.support_reference,
    };

    // Send notification to support team and confirmation email to customer
    const user = await convex.query(api.queries.users.getById, {
      userId,
      sessionToken: sessionToken || undefined
    });
    const customerEmail = user?.email || '';

    if (customerEmail) {
      sendSupportCaseNotification(
        formattedCase.support_reference,
        customerEmail,
        formattedCase.subject
      ).catch((error) => {
        logger.error('Failed to send support case notifications:', error);
      });
    }

    return ResponseFactory.success(
      formattedCase,
      'Support case created successfully'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to create support case'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

