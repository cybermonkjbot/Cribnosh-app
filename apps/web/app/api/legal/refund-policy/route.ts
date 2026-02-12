import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /legal/refund-policy:
 *   get:
 *     summary: Get Refund Policy
 *     description: Get the refund policy content for the platform
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Refund policy retrieved successfully
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
 *                     title:
 *                       type: string
 *                       example: "Refund Policy"
 *                     content:
 *                       type: string
 *                       description: Formatted HTML or markdown content
 *                     lastUpdated:
 *                       type: number
 *                       description: Last update timestamp
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Fetch from database or CMS when available
    // For now, return static content
    const content = {
      title: 'Refund Policy',
      content: `
# Refund Policy

**Last Updated:** ${new Date().toLocaleDateString()}

## 1. Our Commitment
CribNosh is committed to ensuring you have a great dining experience. If you are unsatisfied with your order, please contact us immediately.

## 2. Eligibility for Refunds
- **Missing Items:** Refund for the cost of the specific item.
- **Incorrect Items:** Refund for the cost of the specific item.
- **Quality Issues:** Full or partial refund for food not meeting reasonable standards (evidence may be required).
- **Delivery Issues:** Potential refund for orders never delivered or significantly delayed without notice.

## 3. How to Request a Refund
1. **Contact Support:** Via the app or email support@cribnosh.co.uk.
2. **Timeframe:** Within 24 hours of delivery.
3. **Details:** Provide Order ID, description of issue, and photos (if applicable).

## 4. Refund Processing
- **Method:** Original payment method.
- **Timing:** 5-10 business days depending on your bank.

## 5. Order Cancellations
- **Before Acceptance/Prep:** Full refund available.
- **After Prep Started:** Full refund not guaranteed; case-by-case review.

## 6. Statutory Rights
Nothing in this policy affects your statutory rights under the Consumer Rights Act 2015. You have the right to expect food that is of satisfactory quality, fit for purpose, and as described.
      `.trim(),
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(content);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch refund policy.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

