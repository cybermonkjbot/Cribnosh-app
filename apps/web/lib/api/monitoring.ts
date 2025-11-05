import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

export interface APIMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  statusCodeDistribution: Record<string, number>;
  endpointUsage: Record<string, number>;
  userAgentDistribution: Record<string, number>;
  ipDistribution: Record<string, number>;
}

export class APIMonitoring {
  private static instance: APIMonitoring;
  private metrics: APIMetrics;

  private constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      statusCodeDistribution: {},
      endpointUsage: {},
      userAgentDistribution: {},
      ipDistribution: {},
    };
  }

  public static getInstance(): APIMonitoring {
    if (!APIMonitoring.instance) {
      APIMonitoring.instance = new APIMonitoring();
    }
    return APIMonitoring.instance;
  }

  /**
   * Record API request metrics
   */
  recordRequest(
    request: NextRequest,
    response: NextResponse,
    duration: number,
    error?: Error
  ): void {
    const path = request.nextUrl.pathname;
    const method = request.method;
    const status = response.status;
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ip = this.getClientIP(request);

    // Increment request count
    this.metrics.requestCount++;
    monitoring.incrementMetric('api_requests_total');
    // Record response time
    monitoring.recordDuration('api_response_time_ms', duration);

    // Update average response time
    this.updateAverageResponseTime(duration);

    // Record status code distribution
    this.recordStatusCode(status);

    // Record endpoint usage
    this.recordEndpointUsage(`${method} ${path}`);

    // Record user agent distribution
    this.recordUserAgent(userAgent);

    // Record IP distribution
    this.recordIP(ip);

    // Record errors
    if (error || status >= 400) {
      this.metrics.errorCount++;
      monitoring.incrementMetric('api_errors_total');

      if (error) {
        monitoring.logError(error, {
          context: 'api_request_error',
          method,
          path,
          status,
          duration,
          ip,
          userAgent,
        });
      }
    }

    // Log request details
    this.logRequest(request, response, duration, error);
  }

  /**
   * Get current metrics
   */
  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      statusCodeDistribution: {},
      endpointUsage: {},
      userAgentDistribution: {},
      ipDistribution: {},
    };
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(duration: number): void {
    const { requestCount, averageResponseTime } = this.metrics;
    this.metrics.averageResponseTime = 
      (averageResponseTime * (requestCount - 1) + duration) / requestCount;
  }

  /**
   * Record status code distribution
   */
  private recordStatusCode(status: number): void {
    const statusGroup = this.getStatusGroup(status);
    this.metrics.statusCodeDistribution[statusGroup] = 
      (this.metrics.statusCodeDistribution[statusGroup] || 0) + 1;
  }

  /**
   * Record endpoint usage
   */
  private recordEndpointUsage(endpoint: string): void {
    this.metrics.endpointUsage[endpoint] = 
      (this.metrics.endpointUsage[endpoint] || 0) + 1;
  }

  /**
   * Record user agent distribution
   */
  private recordUserAgent(userAgent: string): void {
    const browser = this.extractBrowser(userAgent);
    this.metrics.userAgentDistribution[browser] = 
      (this.metrics.userAgentDistribution[browser] || 0) + 1;
  }

  /**
   * Record IP distribution
   */
  private recordIP(ip: string): void {
    // Only record unique IPs to avoid memory issues
    if (!this.metrics.ipDistribution[ip]) {
      this.metrics.ipDistribution[ip] = 0;
    }
    this.metrics.ipDistribution[ip]++;
  }

  /**
   * Get status code group
   */
  private getStatusGroup(status: number): string {
    if (status >= 200 && status < 300) return '2xx';
    if (status >= 300 && status < 400) return '3xx';
    if (status >= 400 && status < 500) return '4xx';
    if (status >= 500) return '5xx';
    return 'other';
  }

  /**
   * Extract browser from user agent
   */
  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('bot') || userAgent.includes('crawler')) return 'Bot';
    return 'Other';
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  }

  /**
   * Log request details
   */
  private logRequest(
    request: NextRequest,
    response: NextResponse,
    duration: number,
    error?: Error
  ): void {
    const logData = {
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      duration,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    if (error) {
      monitoring.logError(error, {
        context: 'api_request',
        ...logData,
      });
    } else if (response.status >= 400) {
      monitoring.logWarning('API request failed', logData);
    } else {
      monitoring.logInfo('API request completed', logData);
    }
  }

  /**
   * Generate health check data
   */
  getHealthData(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: APIMetrics;
    uptime: number;
    errorRate: number;
  } {
    const errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > 10) {
      status = 'unhealthy';
    } else if (errorRate > 5) {
      status = 'degraded';
    }

    return {
      status,
      metrics: this.getMetrics(),
      uptime: process.uptime(),
      errorRate,
    };
  }
}

// Export singleton instance
export const apiMonitoring = APIMonitoring.getInstance(); 