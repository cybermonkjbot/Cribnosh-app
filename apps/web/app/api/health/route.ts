import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { MonitoringService } from '../../../lib/monitoring/monitoring.service';
import { EmailService } from '../../../lib/email/email.service';
import { apiMonitoring, APIMetrics } from '../../../lib/api/monitoring';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { securityMiddleware } from '@/lib/api/security';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
// import { checkAPIHealth } from '@/lib/api/client'; // Unused for now

const monitoring = MonitoringService.getInstance();

// Initialize services with configuration
const emailService = new EmailService({
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
  },
});

// Optimized timeout wrapper for service health checks with shorter timeouts
const checkServiceWithTimeout = async (
  checkFn: () => Promise<unknown>,
  timeoutMs: number = 2000  // Reduced from 5000ms to 2000ms for faster response
): Promise<{ status: string; details: string; responseTime?: number }> => {
  const startTime = Date.now();
  try {
    await Promise.race([
      checkFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      )
    ]);
    const responseTime = Date.now() - startTime;
    return { status: 'healthy', details: 'OK', responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return { 
      status: 'degraded', 
      details: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    };
  }
};

// Optimized network connectivity test with shorter timeout
const testNetworkConnectivity = async (): Promise<{ status: string; details: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);  // Reduced from 10000ms to 3000ms
    
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'CribNosh-HealthCheck/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { status: 'healthy', details: 'External connectivity OK' };
    } else {
      return { status: 'degraded', details: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      details: error instanceof Error ? error.message : 'Network test failed' 
    };
  }
};

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check the health status of all services and systems
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Health check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of the health check
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   description: Overall system health status
 *                   example: "healthy"
 *                 version:
 *                   type: string
 *                   description: Application version
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   description: Environment name
 *                   example: "production"
 *                 services:
 *                   type: object
 *                   description: Health status of individual services
 *                   properties:
 *                     email:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy, unknown]
 *                         details:
 *                           type: string
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy, unknown]
 *                         details:
 *                           type: string
 *                     monitoring:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy, unknown]
 *                         details:
 *                           type: string
 *                     convex:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy, unknown]
 *                         details:
 *                           type: string
 *                 api:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy, unknown]
 *                     metrics:
 *                       type: object
 *                       nullable: true
 *                     uptime:
 *                       type: number
 *                     errorRate:
 *                       type: number
 *                 system:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                       description: Node.js memory usage
 *                     uptime:
 *                       type: number
 *                       description: Process uptime in seconds
 *                     nodeVersion:
 *                       type: string
 *                       description: Node.js version
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return securityMiddleware.applyCORSHeaders(response, request);
  }
  const healthChecks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      email: { status: 'unknown', details: '' },
      redis: { status: 'unknown', details: '' },
      monitoring: { status: 'unknown', details: '' },
      convex: { status: 'unknown', details: '' },
      network: { status: 'unknown', details: '' },
    },
    api: {
      status: 'unknown',
      metrics: null as APIMetrics | null,
      uptime: 0,
      errorRate: 0,
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  };

  try {
    // Check email service health
    try {
      // Simple health check - just verify the service is initialized
      emailService.getTemplateRenderer();
      healthChecks.services.email = {
        status: 'healthy',
        details: 'Email service initialized successfully',
      };
    } catch (error) {
      healthChecks.services.email = {
        status: 'unhealthy',
        details: `Email service error: ${error}`,
      };
    }

    // Check monitoring service health
    try {
      monitoring.logInfo('Health check performed', { services: Object.keys(healthChecks.services) });
      healthChecks.services.monitoring = {
        status: 'healthy',
        details: 'Monitoring service operational',
      };
    } catch (error) {
      healthChecks.services.monitoring = {
        status: 'unhealthy',
        details: `Monitoring service error: ${error}`,
      };
    }

    // Check Convex DB health with optimized timeout
    try {
      const convex = getConvexClient();
      // Try a simple query with shorter timeout for faster health checks
      healthChecks.services.convex = await checkServiceWithTimeout(async () => {
        await convex.query(api.queries.users.getAllUsers, {});
        return { status: 'healthy', details: 'Convex DB connection successful' };
      }, 2000);  // Reduced from 5000ms to 2000ms
    } catch (error) {
      healthChecks.services.convex = {
        status: 'degraded',
        details: `Convex DB error: ${error}`,
      };
    }

    // Check network connectivity
    try {
      healthChecks.services.network = await testNetworkConnectivity();
    } catch (error) {
      healthChecks.services.network = {
        status: 'unhealthy',
        details: `Network test failed: ${error}`,
      };
    }

    // Get API health data
    try {
      const apiHealth = apiMonitoring.getHealthData();
      healthChecks.api = {
        status: apiHealth.status,
        metrics: apiHealth.metrics,
        uptime: apiHealth.uptime,
        errorRate: apiHealth.errorRate,
      };
    } catch {
      healthChecks.api = {
        status: 'unhealthy',
        metrics: null,
        uptime: 0,
        errorRate: 0,
      };
    }

    // Determine overall health status
    const unhealthyServices = Object.values(healthChecks.services).filter(
      (service) => service.status === 'unhealthy'
    );

    if (unhealthyServices.length > 0 || healthChecks.api.status === 'unhealthy') {
      healthChecks.status = 'degraded';
    }

    // Always return 200 for App Runner health checks to prevent false positives
    // App Runner should stay up even if external services are slow/degraded
    const statusCode = 200;

    const response = ResponseFactory.success(healthChecks, 'Health check completed', statusCode, {
      cache: {
        cached: false,
        ttl: 0
      }
    });
    
    // Apply CORS headers
    return securityMiddleware.applyCORSHeaders(response, request);
  } catch (error) {
    monitoring.logError(error as Error, { context: 'health_check' });
    
    const errorResponse = ResponseFactory.serviceUnavailable(
      'Health check failed',
      {
        cache: {
          cached: false,
          ttl: 0
        }
      }
    );
    
    // Apply CORS headers
    return securityMiddleware.applyCORSHeaders(errorResponse, request);
  }
}