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

Last Updated: ${new Date().toLocaleDateString()}

## Overview
Cribnosh strives to provide excellent service. If you're not satisfied with your order, we're here to help.

## Refund Eligibility
Refunds may be available for:
- Orders that were not delivered
- Orders with quality issues
- Orders cancelled before preparation
- Orders with incorrect items

## Refund Process
1. Contact our support team within 24 hours of delivery
2. Provide order details and reason for refund
3. Our team will review your request
4. Refunds will be processed within 5-7 business days

## Non-Refundable Items
- Orders cancelled after preparation has started
- Custom orders that have been prepared
- Orders with no valid reason for refund

## Contact Us
For refund requests, please contact support@cribnosh.com or use the in-app support feature.
      `.trim(),
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(content);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch refund policy.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

