import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

export interface SecurityConfig {
  enableCORS: boolean;
  allowedOrigins: string[];
  enableCSRF: boolean;
  enableHSTS: boolean;
  enableContentSecurityPolicy: boolean;
  maxRequestSize: number; // in bytes
  enableRequestLogging: boolean;
  blockSuspiciousIPs: boolean;
  suspiciousIPs: string[];
}

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableCORS: true,
      allowedOrigins: [
        'https://cribnosh.com',
        'https://www.cribnosh.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      enableCSRF: true,
      enableHSTS: true,
      enableContentSecurityPolicy: true,
      maxRequestSize: 1024 * 1024, // 1MB
      enableRequestLogging: true,
      blockSuspiciousIPs: true,
      suspiciousIPs: [],
      ...config,
    };
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(response: NextResponse): NextResponse {
    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

    // HSTS (HTTP Strict Transport Security)
    if (this.config.enableHSTS) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Content Security Policy
    if (this.config.enableContentSecurityPolicy) {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.convex.cloud https://api.resend.com https://api.notion.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
      response.headers.set('Content-Security-Policy', csp);
    }

    return response;
  }

  /**
   * Validate CORS
   */
  validateCORS(request: NextRequest): boolean {
    if (!this.config.enableCORS) return true;

    const origin = request.headers.get('origin');
    if (!origin) return true; // Same-origin request

    return this.config.allowedOrigins.includes(origin);
  }

  /**
   * Apply CORS headers
   */
  applyCORSHeaders(response: NextResponse, request: NextRequest): NextResponse {
    console.log('[CORS] Applying CORS headers, enableCORS:', this.config.enableCORS);
    if (!this.config.enableCORS) return response;

    const origin = request.headers.get('origin');
    const hostname = request.headers.get('host') || '';
    const isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1');

    console.log('[CORS] Origin:', origin, 'Hostname:', hostname, 'IsDevelopment:', isDevelopment);

    // In development, allow all origins for localhost
    if (isDevelopment) {
      console.log('[CORS] Setting Access-Control-Allow-Origin to * for development');
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else if (origin && this.config.allowedOrigins.includes(origin)) {
      console.log('[CORS] Setting Access-Control-Allow-Origin to:', origin);
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');

    console.log('[CORS] CORS headers applied');
    return response;
  }

  /**
   * Validate request size
   */
  validateRequestSize(request: NextRequest): boolean {
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      return size <= this.config.maxRequestSize;
    }
    return true;
  }

  /**
   * Check for suspicious IPs
   */
  isSuspiciousIP(request: NextRequest): boolean {
    if (!this.config.blockSuspiciousIPs) return false;

    const ip = this.getClientIP(request);
    return this.config.suspiciousIPs.includes(ip);
  }

  /**
   * Get real client IP
   */
  getClientIP(request: NextRequest): string {
    return (
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(request: NextRequest): boolean {
    if (!this.config.enableCSRF) return true;

    // Skip CSRF validation for GET requests
    if (request.method === 'GET') return true;

    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = request.cookies.get('csrf-token')?.value;

    if (!csrfToken || !sessionToken) {
      return false;
    }

    // In production, you'd want to use a proper CSRF validation library
    // For now, we'll do a simple comparison
    return csrfToken === sessionToken;
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(request: NextRequest, reason: string): void {
    if (!this.config.enableRequestLogging) return;

    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const path = request.nextUrl.pathname;

    monitoring.logWarning('Suspicious activity detected', {
      ip,
      userAgent,
      path,
      reason,
      timestamp: new Date().toISOString(),
    });

    monitoring.incrementMetric('suspicious_activity_total');
  }

  /**
   * Main security middleware function
   */
  async process(request: NextRequest): Promise<NextResponse | null> {
    const ip = this.getClientIP(request);
    const path = request.nextUrl.pathname;

    // Log request if enabled
    if (this.config.enableRequestLogging) {
      monitoring.logInfo('API request', {
        method: request.method,
        path,
        ip,
        userAgent: request.headers.get('user-agent'),
      });
    }

    // Check for suspicious IPs
    if (this.isSuspiciousIP(request)) {
      this.logSuspiciousActivity(request, 'Suspicious IP');
      return new NextResponse(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate request size
    if (!this.validateRequestSize(request)) {
      this.logSuspiciousActivity(request, 'Request too large');
      return new NextResponse(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate CORS
    if (!this.validateCORS(request)) {
      this.logSuspiciousActivity(request, 'CORS violation');
      return new NextResponse(
        JSON.stringify({ error: 'CORS policy violation' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate CSRF for non-GET requests
    if (!this.validateCSRFToken(request)) {
      this.logSuspiciousActivity(request, 'CSRF violation');
      return new NextResponse(
        JSON.stringify({ error: 'CSRF token validation failed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return null; // Continue with request
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware(); 