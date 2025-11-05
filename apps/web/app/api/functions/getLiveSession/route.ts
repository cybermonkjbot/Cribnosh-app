import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from "@/convex/_generated/api";

/**
 * @swagger
 * /functions/getLiveSession:
 *   get:
 *     summary: Get Live Session by ID
 *     description: Retrieve a specific live session by its session ID
 *     tags: [Live Streaming]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The session ID to retrieve
 *         example: "live-1640995200000"
 *     responses:
 *       200:
 *         description: Live session retrieved successfully
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
 *                     _id:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     session_id:
 *                       type: string
 *                       example: "live-1640995200000"
 *                     chef_id:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     title:
 *                       type: string
 *                       example: "Cooking Authentic Italian Pasta"
 *                     description:
 *                       type: string
 *                       example: "Join me as I prepare traditional Italian pasta"
 *                     status:
 *                       type: string
 *                       enum: [scheduled, starting, live, ended, cancelled]
 *                       example: "live"
 *                     location:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         city:
 *                           type: string
 *                           example: "London"
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [-0.1276, 51.5074]
 *                         address:
 *                           type: string
 *                           example: "123 Baker Street, London"
 *                         radius:
 *                           type: number
 *                           example: 10
 *                     viewerCount:
 *                       type: number
 *                       example: 15
 *                     chatEnabled:
 *                       type: boolean
 *                       example: true
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["italian", "pasta", "cooking"]
 *                     _creationTime:
 *                       type: number
 *                       example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Live session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handleGET(req: NextRequest) {
  try {
    const client = getConvexClient();
    
    // Extract sessionId from query parameters
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return ResponseFactory.validationError('Session ID is required');
    }

    const result = await client.query(api.queries.liveSessions.getLiveSessionById, {
      sessionId,
    });

    if (!result) {
      return ResponseFactory.error('Live session not found', 'NOT_FOUND', 404);
    }

    return ResponseFactory.success(result, 'Live session retrieved successfully');
  } catch (error) {
    console.error('Error getting live session:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const GET = withErrorHandling(handleGET);
