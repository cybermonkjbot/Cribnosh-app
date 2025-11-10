import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /legal/privacy-policy:
 *   get:
 *     summary: Get Privacy Policy
 *     description: Get the privacy policy content for the platform
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Privacy policy retrieved successfully
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
 *                       example: "Privacy Policy"
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
      title: 'Privacy Policy',
      content: `
# Privacy Policy

Last Updated: ${new Date().toLocaleDateString()}

## Introduction
Cribnosh ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information.

## Information We Collect
- Personal information (name, email, phone number)
- Location data
- Payment information
- Usage data and analytics

## How We Use Your Information
- To provide and improve our services
- To process transactions
- To communicate with you
- To ensure platform safety and security

## Data Protection
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Your Rights
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Object to processing of your data

## Contact Us
If you have questions about this Privacy Policy, please contact us at privacy@cribnosh.com.
      `.trim(),
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(content);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch privacy policy.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

