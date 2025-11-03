/**
 * Enhanced monitoring service for network errors and system health
 */

export interface NetworkErrorMetrics {
  totalErrors: number;
  networkErrors: number;
  timeoutErrors: number;
  databaseErrors: number;
  lastErrorTime: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface SystemHealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;
  requestCount: number;
  errorCount: number;
}

export class NetworkMonitoringService {
  private static instance: NetworkMonitoringService;
  private errorCounts: Map<string, number> = new Map();
  private responseTimes: number[] = [];
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  private constructor() {
    this.startHealthMonitoring();
  }

  public static getInstance(): NetworkMonitoringService {
    if (!NetworkMonitoringService.instance) {
      NetworkMonitoringService.instance = new NetworkMonitoringService();
    }
    return NetworkMonitoringService.instance;
  }

  /**
   * Record a network error for monitoring
   */
  public recordError(errorType: string, error: Error, context?: Record<string, unknown>): void {
    const timestamp = Date.now();
    const errorKey = `${errorType}_${Math.floor(timestamp / 60000)}`; // Group by minute
    
    // Increment error count
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Log error details
    console.error(`[NETWORK_MONITOR] ${errorType}:`, {
      message: error.message,
      stack: error.stack,
      timestamp,
      context,
      errorCount: currentCount + 1
    });

    // Send alert if error rate is high
    this.checkErrorThresholds(errorType, currentCount + 1);
  }

  /**
   * Record response time for performance monitoring
   */
  public recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Get current network error metrics
   */
  public getNetworkErrorMetrics(): NetworkErrorMetrics {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    let totalErrors = 0;
    let networkErrors = 0;
    let timeoutErrors = 0;
    let databaseErrors = 0;
    let lastErrorTime = 0;

    // Count errors from the last hour
    for (const [key, count] of this.errorCounts.entries()) {
      const timestamp = parseInt(key.split('_')[1]) * 60000;
      if (timestamp > oneHourAgo) {
        totalErrors += count;
        
        if (key.startsWith('NETWORK_ERROR')) {
          networkErrors += count;
        } else if (key.startsWith('TIMEOUT_ERROR')) {
          timeoutErrors += count;
        } else if (key.startsWith('DATABASE_ERROR')) {
          databaseErrors += count;
        }
        
        lastErrorTime = Math.max(lastErrorTime, timestamp);
      }
    }

    const averageResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    return {
      totalErrors,
      networkErrors,
      timeoutErrors,
      databaseErrors,
      lastErrorTime,
      errorRate: totalErrors / 60, // Errors per minute
      averageResponseTime
    };
  }

  /**
   * Get system health metrics
   */
  public getSystemHealthMetrics(): SystemHealthMetrics {
    const memUsage = process.memoryUsage();
    
    return {
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
      diskUsage: 0, // Would need additional monitoring
      networkLatency: this.responseTimes.length > 0 
        ? this.responseTimes.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, this.responseTimes.length)
        : 0,
      uptime: process.uptime(),
      requestCount: this.responseTimes.length,
      errorCount: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Check if error thresholds are exceeded
   */
  private checkErrorThresholds(errorType: string, count: number): void {
    const thresholds = {
      NETWORK_ERROR: 10, // 10 network errors per minute
      TIMEOUT_ERROR: 5,  // 5 timeout errors per minute
      DATABASE_ERROR: 3, // 3 database errors per minute
      UNKNOWN_ERROR: 15  // 15 unknown errors per minute
    };

    const threshold = thresholds[errorType as keyof typeof thresholds] || thresholds.UNKNOWN_ERROR;
    
    if (count > threshold) {
      this.sendAlert(errorType, count, threshold);
    }
  }

  /**
   * Send alert for high error rates
   */
  private sendAlert(errorType: string, count: number, threshold: number): void {
    const alert = {
      type: 'HIGH_ERROR_RATE',
      errorType,
      count,
      threshold,
      timestamp: Date.now(),
      message: `High ${errorType} rate detected: ${count} errors (threshold: ${threshold})`
    };

    console.warn(`[ALERT] ${alert.message}`);
    
    // In production, you would send this to your alerting system
    // e.g., Slack, PagerDuty, email, etc.
    this.sendToAlertingSystem(alert);
  }

  /**
   * Send alert to external alerting system
   */
  private sendToAlertingSystem(alert: any): void {
    // This would integrate with your alerting system
    // For now, just log it
    console.error('[ALERTING]', alert);
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const metrics = this.getNetworkErrorMetrics();
      const health = this.getSystemHealthMetrics();
      
      // Check if system is healthy
      const isHealthy = this.isSystemHealthy(metrics, health);
      
      if (!isHealthy) {
        this.sendAlert('SYSTEM_UNHEALTHY', 1, 0);
      }

      // Clean up old error counts (older than 1 hour)
      this.cleanupOldMetrics();
      
      this.lastHealthCheck = Date.now();
    } catch (error) {
      console.error('[HEALTH_CHECK] Failed:', error);
    }
  }

  /**
   * Determine if system is healthy based on metrics
   */
  private isSystemHealthy(metrics: NetworkErrorMetrics, health: SystemHealthMetrics): boolean {
    // System is unhealthy if:
    // - Error rate > 5 errors per minute
    // - Average response time > 5 seconds
    // - Memory usage > 90%
    // - Uptime < 1 minute (recent restart)
    
    return (
      metrics.errorRate < 5 &&
      metrics.averageResponseTime < 5000 &&
      health.memoryUsage < 0.9 &&
      health.uptime > 60
    );
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [key] of this.errorCounts.entries()) {
      const timestamp = parseInt(key.split('_')[1]) * 60000;
      if (timestamp < oneHourAgo) {
        this.errorCounts.delete(key);
      }
    }
  }

  /**
   * Get health status for external monitoring
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: NetworkErrorMetrics;
    health: SystemHealthMetrics;
    lastCheck: number;
  } {
    const metrics = this.getNetworkErrorMetrics();
    const health = this.getSystemHealthMetrics();
    const isHealthy = this.isSystemHealthy(metrics, health);
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      metrics,
      health,
      lastCheck: this.lastHealthCheck
    };
  }
}

// Export singleton instance
export const networkMonitoring = NetworkMonitoringService.getInstance();
