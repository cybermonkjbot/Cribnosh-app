import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { securityMiddleware } from '@/lib/api/security';

/**
 * Fast health check endpoint for App Runner
 * This endpoint is optimized for speed and should respond within 1 second
 * Used by App Runner for basic health monitoring
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return securityMiddleware.applyCORSHeaders(response, request);
  }

  try {
    // Minimal health check response - just verify the app is running
    const fastHealthCheck = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
      // Skip external service checks for fast response
      services: {
        app: { status: 'healthy', details: 'Application running' }
      }
    };

    const response = ResponseFactory.success(fastHealthCheck, 'Fast health check completed', 200, {
      cache: {
        cached: false,
        ttl: 0
      }
    });
    
    // Apply CORS headers
    return securityMiddleware.applyCORSHeaders(response, request);
  } catch (error) {
    // Even if there's an error, return a basic response to keep App Runner healthy
    const errorResponse = ResponseFactory.serviceUnavailable(
      'Fast health check failed',
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
