import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedDriver } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /driver/payouts/request:
 *   post:
 *     summary: Request Payout
 *     description: Request a payout for the current driver. Validates bank details and creates a payout request.
 *     tags: [Driver]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - bankDetails
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to request for payout
 *                 example: 150.50
 *               bankDetails:
 *                 type: object
 *                 required:
 *                   - accountNumber
 *                   - bankName
 *                   - accountName
 *                 properties:
 *                   accountNumber:
 *                     type: string
 *                     description: Bank account number
 *                   bankName:
 *                     type: string
 *                     description: Bank name
 *                   accountName:
 *                     type: string
 *                     description: Account holder name
 *     responses:
 *       200:
 *         description: Payout request submitted successfully
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
 *                     payoutId:
 *                       type: string
 *                       description: Payout request ID
 *                     message:
 *                       type: string
 *                       example: "Payout request submitted successfully"
 *       400:
 *         description: Validation error - invalid amount or bank details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can request payouts
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedDriver(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get driver profile by user email
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    const body = await request.json();
    const { amount, bankDetails } = body;

    // Validate request body
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return ResponseFactory.validationError('Invalid amount. Amount must be a positive number.');
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName) {
      return ResponseFactory.validationError('Invalid bank details. accountNumber, bankName, and accountName are required.');
    }

    // Validate bank details match driver profile (optional check)
    if (driver.bankName && driver.bankName !== bankDetails.bankName) {
      return ResponseFactory.validationError('Bank name does not match driver profile. Please update your profile first.');
    }

    if (driver.accountNumber && driver.accountNumber !== bankDetails.accountNumber) {
      return ResponseFactory.validationError('Account number does not match driver profile. Please update your profile first.');
    }

    // Get current earnings to validate amount
    const earnings = await convex.query(api.queries.drivers.getEarningsByDriver, {
      driverId: driver._id,
      sessionToken: sessionToken || undefined,
    });

    if (amount > (earnings?.totalEarnings || 0)) {
      return ResponseFactory.validationError('Requested amount exceeds available earnings.');
    }

    // For now, we'll just return success with a mock payout ID
    // In a full implementation, you would create a payout request record in the database
    // TODO: Create payout request mutation in Convex
    const payoutId = `payout_${Date.now()}_${driver._id}`;

    return ResponseFactory.success({
      payoutId,
      message: 'Payout request submitted successfully. Your payout will be processed within 3-5 business days.',
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to request payout.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

