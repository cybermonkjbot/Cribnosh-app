import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { securityMiddleware } from '@/lib/api/security';

/**
 * Keep-alive endpoint to prevent instances from going cold
 * This endpoint is called periodically to keep instances warm
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return securityMiddleware.applyCORSHeaders(response, request);
  }

  try {
    // Simple keep-alive response with minimal processing
    const keepAliveResponse = {
      timestamp: new Date().toISOString(),
      status: 'alive',
      instanceId: process.env.HOSTNAME || 'unknown',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
      // Add a small computation to keep the instance active
      checksum: Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64').slice(0, 8)
    };

    const response = ResponseFactory.success(keepAliveResponse, 'Instance keep-alive successful', 200, {
      cache: {
        cached: false,
        ttl: 0
      }
    });
    
    // Apply CORS headers
    return securityMiddleware.applyCORSHeaders(response, request);
  } catch {
    // Even if there's an error, return a basic response to keep the instance alive
    const errorResponse = ResponseFactory.serviceUnavailable(
      'Keep-alive failed',
      {
        cache: {
          cached: false,
          ttl: 0
        }
      }
    );
    
    return securityMiddleware.applyCORSHeaders(errorResponse, request);
  }
}
