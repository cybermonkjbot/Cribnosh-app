import { NextRequest, NextResponse } from 'next/server';

/**
 * Fast health check endpoint for App Runner
 * This endpoint is optimized for speed and should respond within 1 second
 * Decoupled from all app-specific logic to ensure reliability during startup
 */
export async function GET(request: NextRequest) {
  try {
    process.stdout.write(`[HEALTHCHECK] Ping received at ${new Date().toISOString()}\n`);
    return new NextResponse(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'healthy',
        uptime: process.uptime(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        },
      }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ status: 'error', message: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
