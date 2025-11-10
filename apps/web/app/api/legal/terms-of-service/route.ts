import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /legal/terms-of-service:
 *   get:
 *     summary: Get Terms of Service
 *     description: Get the terms of service content for the platform
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Terms of service retrieved successfully
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
 *                       example: "Terms of Service"
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
      title: 'Terms of Service',
      content: `
# Terms of Service

Last Updated: ${new Date().toLocaleDateString()}

## Agreement to Terms
By accessing or using Cribnosh, you agree to be bound by these Terms of Service.

## Use of Service
- You must be at least 18 years old to use our service
- You agree to provide accurate information
- You are responsible for maintaining account security
- You agree not to misuse the platform

## User Responsibilities
- Follow all applicable laws and regulations
- Respect other users and service providers
- Provide accurate information
- Report any issues or concerns

## Service Availability
We strive to provide reliable service but do not guarantee uninterrupted access. We reserve the right to modify or discontinue services at any time.

## Limitation of Liability
Cribnosh is not liable for any indirect, incidental, or consequential damages arising from use of the platform.

## Changes to Terms
We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.

## Contact Us
For questions about these terms, please contact legal@cribnosh.com.
      `.trim(),
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(content);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch terms of service.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

