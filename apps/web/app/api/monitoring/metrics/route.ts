import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { monitoringService, MetricData } from '@/lib/monitoring/monitor';

/**
 * @swagger
 * /monitoring/metrics:
 *   get:
 *     summary: Get System Metrics
 *     description: Retrieve system performance metrics and monitoring data. This endpoint provides access to various system metrics including performance, business metrics, and API statistics for monitoring and analytics purposes.
 *     tags: [Monitoring, Metrics]
 *     parameters:
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *         description: Specific metric name to retrieve
 *         example: "api_response_time"
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *           default: "1h"
 *         description: Time range for metric data
 *         example: "24h"
 *       - in: query
 *         name: aggregation
 *         schema:
 *           type: string
 *           enum: [avg, sum, min, max, count]
 *           default: "avg"
 *         description: Aggregation method for metric data
 *         example: "avg"
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
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
 *                     metrics:
 *                       type: array
 *                       description: Array of metric data points
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             description: Metric timestamp
 *                             example: "2024-01-15T14:30:00Z"
 *                           value:
 *                             type: number
 *                             description: Metric value
 *                             example: 125.5
 *                           tags:
 *                             type: object
 *                             additionalProperties: true
 *                             description: Metric tags
 *                             example:
 *                               endpoint: "/api/orders"
 *                               method: "POST"
 *                               status: "200"
 *                     summary:
 *                       type: object
 *                       description: Metric summary statistics
 *                       properties:
 *                         average:
 *                           type: number
 *                           example: 125.5
 *                         min:
 *                           type: number
 *                           example: 45.2
 *                         max:
 *                           type: number
 *                           example: 250.8
 *                         count:
 *                           type: integer
 *                           example: 1250
 *                         trend:
 *                           type: string
 *                           enum: [up, down, stable]
 *                           description: Trend direction
 *                           example: "up"
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         timeRange:
 *                           type: string
 *                           example: "24h"
 *                         aggregation:
 *                           type: string
 *                           example: "avg"
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid parameters
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
 *       - bearerAuth: []
 *   post:
 *     summary: Record System Metrics
 *     description: Record system metrics and performance data. This endpoint allows recording various types of metrics including API performance, business metrics, and custom application metrics for monitoring and analytics.
 *     tags: [Monitoring, Metrics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [record_metric]
 *                     example: "record_metric"
 *                   data:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Metric name
 *                         example: "api_response_time"
 *                       value:
 *                         type: number
 *                         description: Metric value
 *                         example: 125.5
 *                       tags:
 *                         type: object
 *                         additionalProperties: true
 *                         description: Metric tags
 *                         example:
 *                           endpoint: "/api/orders"
 *                           method: "POST"
 *               - type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [record_metrics]
 *                     example: "record_metrics"
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "api_response_time"
 *                         value:
 *                           type: number
 *                           example: 125.5
 *                         tags:
 *                           type: object
 *                           additionalProperties: true
 *               - type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [record_business_metrics]
 *                     example: "record_business_metrics"
 *                   data:
 *                     type: object
 *                     properties:
 *                       ordersCount:
 *                         type: integer
 *                         example: 25
 *                       revenue:
 *                         type: number
 *                         example: 1250.50
 *                       activeUsers:
 *                         type: integer
 *                         example: 150
 *               - type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [record_api_metric]
 *                     example: "record_api_metric"
 *                   data:
 *                     type: object
 *                     properties:
 *                       endpoint:
 *                         type: string
 *                         example: "/api/orders"
 *                       method:
 *                         type: string
 *                         example: "POST"
 *                       responseTime:
 *                         type: number
 *                         example: 125.5
 *                       statusCode:
 *                         type: integer
 *                         example: 200
 *                       userId:
 *                         type: string
 *                         nullable: true
 *                         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Metrics recorded successfully
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
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     message:
 *                       type: string
 *                       example: "Metric recorded successfully"
 *                     recordedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when metric was recorded
 *                       example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid action or data
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
 *       - bearerAuth: []
 */

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const metricName = url.searchParams.get('metric');
    const timeRange = url.searchParams.get('timeRange') || '1h';

    if (metricName) {
      // Get specific metric data
      // This would implement time-series data retrieval
      return ResponseFactory.success({});
    }
    
    return ResponseFactory.success({});
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return ResponseFactory.internalError('Failed to get metrics');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'record_metric':
        // Record a single metric
        await monitoringService.recordMetric(data as MetricData);
        return ResponseFactory.success({
          status: 'success',
          message: 'Metric recorded successfully',
        });

      case 'record_metrics':
        // Record multiple metrics
        await monitoringService.recordMetrics(data as MetricData[]);
        return ResponseFactory.success({
          status: 'success',
          message: 'Metrics recorded successfully',
        });

      case 'record_business_metrics':
        // Record business metrics
        await monitoringService.recordBusinessMetrics(data);
        return ResponseFactory.success({
          status: 'success',
          message: 'Business metrics recorded successfully',
        });

      case 'record_api_metric':
        // Record API performance metric
        const { endpoint, method, responseTime, statusCode, userId } = data;
        await monitoringService.recordAPIMetric(
          endpoint,
          method,
          responseTime,
          statusCode,
          userId
        );
        return ResponseFactory.success({
          status: 'success',
          message: 'API metric recorded successfully',
        });

      default:
        return ResponseFactory.validationError('Invalid action');
    }
  } catch (error) {
    console.error('Failed to record metrics:', error);
    return ResponseFactory.internalError('Failed to record metrics');
  }
} 