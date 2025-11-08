import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /admin/webhooks-trigger:
 *   post:
 *     summary: Trigger Webhooks (Admin)
 *     description: Manually trigger webhook events to multiple URLs for testing, debugging, or administrative purposes. This endpoint allows administrators to send custom webhook payloads to specified endpoints and receive delivery status reports.
 *     tags: [Admin, Webhooks, Integration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - urls
 *             properties:
 *               event:
 *                 type: string
 *                 description: Webhook event type identifier
 *                 example: "order.created"
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Payload data to send with the webhook
 *                 example:
 *                   orderId: "order_123"
 *                   customerId: "customer_456"
 *                   amount: 25.99
 *                   status: "confirmed"
 *               urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 minItems: 1
 *                 description: Array of webhook URLs to trigger
 *                 example: ["https://example.com/webhook", "https://partner.com/api/webhook"]
 *               timeout:
 *                 type: number
 *                 default: 5000
 *                 description: Request timeout in milliseconds
 *                 example: 5000
 *               retryCount:
 *                 type: number
 *                 default: 0
 *                 description: Number of retry attempts for failed deliveries
 *                 example: 2
 *     responses:
 *       200:
 *         description: Webhooks triggered successfully
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
 *                     results:
 *                       type: array
 *                       description: Delivery results for each URL
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                             description: Webhook URL that was triggered
 *                             example: "https://example.com/webhook"
 *                           status:
 *                             type: number
 *                             description: HTTP status code received
 *                             example: 200
 *                           ok:
 *                             type: boolean
 *                             description: Whether the request was successful
 *                             example: true
 *                           error:
 *                             type: string
 *                             nullable: true
 *                             description: Error message if delivery failed
 *                             example: null
 *                           responseTime:
 *                             type: number
 *                             description: Response time in milliseconds
 *                             example: 150
 *                     totalUrls:
 *                       type: number
 *                       description: Total number of URLs triggered
 *                       example: 2
 *                     successfulDeliveries:
 *                       type: number
 *                       description: Number of successful deliveries
 *                       example: 2
 *                     failedDeliveries:
 *                       type: number
 *                       description: Number of failed deliveries
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Unprocessable entity - invalid webhook configuration
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
 *     security:
 *       - cookieAuth: []
 */

async function handlePOST(request: NextRequest) {
  try {
    // Get authenticated admin from session token
    const { userId } = await getAuthenticatedAdmin(request);
    const convex = getConvexClient();
    const { event, data, urls } = await request.json();
    if (!event || !urls || !Array.isArray(urls) || urls.length === 0) {
      return ResponseFactory.error('event and urls[] are required.', 'CUSTOM_ERROR', 422);
    }
    // Deliver webhook to each URL
    const results = await Promise.all(urls.map(async (url: string) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, data }),
        });
        return { url, status: res.status, ok: res.ok };
      } catch (e) {
        return { url, status: 0, ok: false, error: String(e) };
      }
    }));
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'trigger_webhook',
      details: { event, urls, payload: data },
      adminId: userId,
    });
    return ResponseFactory.success({ success: true, results });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 