/**
 * @swagger
 * components:
 *   schemas:
 *     EmotionsEngineSetting:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: Setting key identifier
 *         value:
 *           type: any
 *           description: Setting value
 *         updatedBy:
 *           type: string
 *           description: User ID who updated the setting
 *         updatedAt:
 *           type: number
 *           description: Timestamp when setting was updated
 *     EmotionsEngineSettingsRequest:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: Setting key identifier
 *         value:
 *           type: any
 *           description: Setting value to set
 */

import { api } from '@/convex/_generated/api';
import { getUserFromRequest } from '@/lib/auth/session';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getSessionTokenFromRequest } from '@/lib/conxed-client';

/**
 * @swagger
 * /api/admin/emotions-engine/settings:
 *   get:
 *     summary: Get emotions engine settings
 *     description: Retrieve emotions engine configuration settings (admin only)
 *     tags: [Admin Emotions Engine]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         description: Specific setting key to retrieve
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
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
 *                     settings:
 *                       $ref: '#/components/schemas/EmotionsEngineSetting'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Set emotions engine setting
 *     description: Create or update an emotions engine setting (admin only)
 *     tags: [Admin Emotions Engine]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmotionsEngineSettingsRequest'
 *     responses:
 *       200:
 *         description: Setting updated successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     result:
 *                       type: object
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing key
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete emotions engine setting
 *     description: Delete an emotions engine setting (admin only)
 *     tags: [Admin Emotions Engine]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key to delete
 *     responses:
 *       200:
 *         description: Setting deleted successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing key
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
    return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
  }
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') || undefined;
  // Use api.queries.emotionsEngine.getEmotionsEngineSettings directly
  const { getConvexClient } = await import('@/lib/conxed-client')
  const sessionToken = getSessionTokenFromRequest(req);;
  const convex = getConvexClient();
  const settings = await convex.query(api.queries.emotionsEngine.getEmotionsEngineSettings, {
    key,
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success({ settings });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
    return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
  }
  const body = await req.json();
  const { key, value } = body;
  if (!key) return ResponseFactory.validationError('Missing key');
  // Use api.mutations.emotionsEngine.setEmotionsEngineSetting directly
  const { getConvexClient, getSessionTokenFromRequest } = await import('@/lib/conxed-client');
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(req);
  const result = await convex.mutation(api.mutations.emotionsEngine.setEmotionsEngineSetting, {
    key,
    value,
    updatedBy: user._id,
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success({ success: true, result });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
    return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
  }
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  if (!key) return ResponseFactory.validationError('Missing key');
  // Use api.mutations.emotionsEngine.deleteEmotionsEngineSetting directly
  const { getConvexClient, getSessionTokenFromRequest } = await import('@/lib/conxed-client');
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(req);
  const result = await convex.mutation(api.mutations.emotionsEngine.deleteEmotionsEngineSetting, {
    key,
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success({ success: result });
} 