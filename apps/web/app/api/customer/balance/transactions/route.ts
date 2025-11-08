import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /customer/balance/transactions:
 *   get:
 *     summary: Get balance transaction history
 *     description: Get paginated list of balance transactions (credits and debits)
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
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "txn_123456"
 *                           type:
 *                             type: string
 *                             enum: [credit, debit]
 *                             example: "credit"
 *                           amount:
 *                             type: integer
 *                             description: Amount in smallest currency unit (positive for credit, negative for debit)
 *                             example: 1000
 *                           currency:
 *                             type: string
 *                             example: "GBP"
 *                           description:
 *                             type: string
 *                             example: "Refund from order #ORD-12345"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-14T15:30:00Z"
 *                           status:
 *                             type: string
 *                             enum: [completed, pending, failed]
 *                             example: "completed"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 45
 *                         total_pages:
 *                           type: integer
 *                           example: 3
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    if (limit < 1) limit = DEFAULT_LIMIT;

    const convex = getConvexClient();

    // Query transactions from database
    const allTransactions = await convex.query(api.queries.customerBalance.getTransactions, {
      userId,
      limit: undefined,
      offset: undefined,
    });

    // Pagination
    const total = allTransactions.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedTransactions = allTransactions.slice(offset, offset + limit);

    return ResponseFactory.success({
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch transactions'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

