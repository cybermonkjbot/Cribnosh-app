import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { monitoringService } from '@/lib/monitoring/monitor';

/**
 * @swagger
 * /monitoring/health:
 *   get:
 *     summary: System Health Check
 *     description: Get system health status and monitoring information
 *     tags: [Monitoring]
 *     parameters:
 *       - in: query
 *         name: detailed
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to return detailed health information
 *         example: true
 *     responses:
 *       200:
 *         description: Health check completed successfully
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
 *                       enum: [healthy, degraded, unhealthy]
 *                       description: Overall system health status
 *                       example: "healthy"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Health check timestamp
 *                       example: "2024-01-15T10:30:00.000Z"
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                       example: 86400
 *                     version:
 *                       type: string
 *                       description: Application version
 *                       example: "1.0.0"
 *                     services:
 *                       type: object
 *                       description: Individual service health (detailed mode only)
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "healthy"
 *                             responseTime:
 *                               type: number
 *                               example: 45
 *                         redis:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "healthy"
 *                             responseTime:
 *                               type: number
 *                               example: 12
 *                         stripe:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "healthy"
 *                             responseTime:
 *                               type: number
 *                               example: 234
 *                     metrics:
 *                       type: object
 *                       description: System metrics (detailed mode only)
 *                       properties:
 *                         memory:
 *                           type: object
 *                           properties:
 *                             used:
 *                               type: number
 *                               example: 512
 *                             total:
 *                               type: number
 *                               example: 1024
 *                             percentage:
 *                               type: number
 *                               example: 50
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             usage:
 *                               type: number
 *                               example: 25.5
 *                         requests:
 *                           type: object
 *                           properties:
 *                             perMinute:
 *                               type: number
 *                               example: 150
 *                             averageResponseTime:
 *                               type: number
 *                               example: 120
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';

    if (detailed) {
      // Get detailed system health
      const health = await monitoringService.getSystemHealth();
      
      return ResponseFactory.success({
        status: 'success',
        data: health,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Basic health check
      const health = await monitoringService.getSystemHealth();
      
      return ResponseFactory.success({
        status: health.status,
        timestamp: new Date().toISOString(),
        uptime: health.uptime,
        version: health.version,
      });
    }
  } catch (error) {
    console.error('Health check failed:', error);
    
    return ResponseFactory.error(
      'Health check failed',
      'HEALTH_CHECK_FAILED',
      500
    );
  }
}

/**
 * @swagger
 * /monitoring/health:
 *   post:
 *     summary: Health Check Actions
 *     description: Perform health check actions like recording health data or triggering checks
 *     tags: [Monitoring]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [record_health, trigger_health_check]
 *                 description: Action to perform
 *                 example: "trigger_health_check"
 *               data:
 *                 type: object
 *                 nullable: true
 *                 description: Health data to record (for record_health action)
 *                 example: {"status": "healthy", "uptime": 86400}
 *     responses:
 *       200:
 *         description: Health check action completed successfully
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
 *                       description: Action result message
 *                       example: "Health data recorded successfully"
 *                     data:
 *                       type: object
 *                       nullable: true
 *                       description: Health data (for trigger_health_check action)
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         uptime:
 *                           type: number
 *                           example: 86400
 *                         version:
 *                           type: string
 *                           example: "1.0.0"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Invalid action or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Health check action failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'record_health':
        // Record system health manually
        await monitoringService.recordSystemHealth(data);
        return ResponseFactory.success({
          status: 'success',
          message: 'Health data recorded successfully',
        });

      case 'trigger_health_check':
        // Trigger a health check and record results
        const health = await monitoringService.getSystemHealth();
        await monitoringService.recordSystemHealth(health);
        return ResponseFactory.success({
          status: 'success',
          data: health,
        });

      default:
        return ResponseFactory.error('Invalid action', 'INVALID_ACTION', 400);
    }
  } catch (error) {
    console.error('Health check action failed:', error);
    
    return ResponseFactory.internalError('Health check action failed');
  }
} 