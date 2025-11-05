import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /get-ip:
 *   get:
 *     summary: Get Client IP Address
 *     description: Retrieve the real IP address of the client making the request
 *     tags: [System]
 *     responses:
 *       200:
 *         description: IP address retrieved successfully
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
 *                     ip:
 *                       type: string
 *                       description: Client IP address
 *                       example: "192.168.1.100"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *     security: []
 */
export async function GET(request: NextRequest) {
  // Get the real IP from the custom header set by middleware
  const ip = request.headers.get('x-real-ip') || '';
  return ResponseFactory.success({ ip });
}
