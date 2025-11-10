import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /legal/community-guidelines:
 *   get:
 *     summary: Get Community Guidelines
 *     description: Get the community guidelines content for the platform
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Community guidelines retrieved successfully
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
 *                       example: "Community Guidelines"
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
      title: 'Community Guidelines',
      content: `
# Community Guidelines

Welcome to Cribnosh! These guidelines help ensure a safe and positive experience for everyone in our community.

## Be Respectful
- Treat all community members with respect and kindness
- Use appropriate language and avoid offensive content
- Respect different opinions and perspectives

## Follow the Rules
- Follow all local laws and regulations
- Comply with platform terms and conditions
- Report any violations or concerns

## Safety First
- Prioritize safety in all interactions
- Report any safety concerns immediately
- Follow health and safety guidelines

## Quality Standards
- Maintain high quality in all services
- Provide accurate information
- Deliver on commitments

Thank you for being part of our community!
      `.trim(),
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(content);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch community guidelines.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

