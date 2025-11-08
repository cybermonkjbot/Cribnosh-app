import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getHeatmapData } from '@/lib/analytics-store';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /analytics/heatmap:
 *   get:
 *     summary: Get Analytics Heatmap Data
 *     description: Retrieve heatmap analytics data for a specific page or section. This endpoint provides user interaction data, click patterns, and engagement metrics visualized as heatmap data for UX analysis and optimization.
 *     tags: [Analytics, Heatmap]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: string
 *         description: Page identifier for heatmap data
 *         example: "chef-dashboard"
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: "24h"
 *         description: Time range for heatmap data
 *         example: "7d"
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [desktop, mobile, tablet, all]
 *           default: "all"
 *         description: Device type filter
 *         example: "mobile"
 *       - in: query
 *         name: userSegment
 *         schema:
 *           type: string
 *           enum: [all, customers, chefs, staff, admins]
 *           default: "all"
 *         description: User segment filter
 *         example: "customers"
 *     responses:
 *       200:
 *         description: Heatmap data retrieved successfully
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
 *                     heatmapData:
 *                       type: array
 *                       description: Array of heatmap data points
 *                       items:
 *                         type: object
 *                         properties:
 *                           x:
 *                             type: number
 *                             description: X coordinate (percentage)
 *                             example: 45.5
 *                           y:
 *                             type: number
 *                             description: Y coordinate (percentage)
 *                             example: 23.8
 *                           intensity:
 *                             type: number
 *                             minimum: 0
 *                             maximum: 100
 *                             description: Click intensity (0-100)
 *                             example: 75.5
 *                           clicks:
 *                             type: integer
 *                             description: Number of clicks at this position
 *                             example: 125
 *                           element:
 *                             type: string
 *                             nullable: true
 *                             description: HTML element identifier
 *                             example: "button-order-now"
 *                           elementType:
 *                             type: string
 *                             nullable: true
 *                             description: Type of element
 *                             example: "button"
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: string
 *                           description: Page identifier
 *                           example: "chef-dashboard"
 *                         timeRange:
 *                           type: string
 *                           description: Time range used
 *                           example: "7d"
 *                         deviceType:
 *                           type: string
 *                           description: Device type filter
 *                           example: "mobile"
 *                         userSegment:
 *                           type: string
 *                           description: User segment filter
 *                           example: "customers"
 *                         totalSessions:
 *                           type: integer
 *                           description: Total sessions analyzed
 *                           example: 1250
 *                         totalClicks:
 *                           type: integer
 *                           description: Total clicks recorded
 *                           example: 8750
 *                         averageSessionDuration:
 *                           type: number
 *                           description: Average session duration in seconds
 *                           example: 180.5
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Data generation timestamp
 *                           example: "2024-01-15T14:30:00Z"
 *                     insights:
 *                       type: object
 *                       nullable: true
 *                       description: Heatmap insights and recommendations
 *                       properties:
 *                         hotSpots:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               x:
 *                                 type: number
 *                                 example: 45.5
 *                               y:
 *                                 type: number
 *                                 example: 23.8
 *                               intensity:
 *                                 type: number
 *                                 example: 95.2
 *                               recommendation:
 *                                 type: string
 *                                 example: "Consider moving this element to a more prominent position"
 *                         coldSpots:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               x:
 *                                 type: number
 *                                 example: 80.2
 *                               y:
 *                                 type: number
 *                                 example: 15.3
 *                               intensity:
 *                                 type: number
 *                                 example: 5.1
 *                               recommendation:
 *                                 type: string
 *                                 example: "This area receives low engagement, consider redesigning"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing page parameter
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url!);
  const page = searchParams.get('page');
  if (!page) {
    return ResponseFactory.validationError('Missing page parameter');
  }
  const data = await getHeatmapData(page);
  return ResponseFactory.success({ data });
}
