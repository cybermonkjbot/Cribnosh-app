import { getConvexClient } from '../conxed-client';
import { api } from '@/convex/_generated/api';

// Simple in-memory cache for monitoring data
class MonitoringCache {
  private cache = new Map<string, { data: unknown; expires: number }>();
  private ttl = 3600000; // 1 hour default TTL

  set(key: string, data: unknown, ttlMs?: number): void {
    const expires = Date.now() + (ttlMs || this.ttl);
    this.cache.set(key, { data, expires });
  }

  get<T = unknown>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const monitoringCache = new MonitoringCache();

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical' | 'warning';
  channels: string[]; // email, slack, webhook
  enabled: boolean;
  emailRecipients?: string[];
  webhookUrls?: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  title?: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'warning';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  service?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    stripe: boolean;
    agora: boolean;
    external_apis: boolean;
  };
  lastCheck: number;
  uptime: number;
  version: string;
}

export interface MetricStats {
  average: number;
  min: number;
  max: number;
  count: number;
}

interface AggregatedMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  lastUpdate: number;
}

export interface PerformanceMetrics {
  api_response_time: number;
  database_query_time: number;
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
  error_rate: number;
  request_rate: number;
}

export interface BusinessMetrics {
  total_orders: number;
  total_revenue: number;
  active_users: number;
  active_chefs: number;
  active_drivers: number;
  live_sessions: number;
  order_completion_rate: number;
  customer_satisfaction: number;
}

class MonitoringService {
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 0.05, // 5%
        duration: 300, // 5 minutes
        severity: 'high',
        channels: ['email', 'slack'],
        enabled: true,
      },
      {
        id: 'slow_response_time',
        name: 'Slow API Response Time',
        metric: 'api_response_time',
        condition: 'gt',
        threshold: 2000, // 2 seconds
        duration: 60, // 1 minute
        severity: 'medium',
        channels: ['slack'],
        enabled: true,
      },
      {
        id: 'database_unavailable',
        name: 'Database Unavailable',
        metric: 'database_health',
        condition: 'eq',
        threshold: 0,
        duration: 30, // 30 seconds
        severity: 'critical',
        channels: ['email', 'slack', 'webhook'],
        enabled: true,
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        metric: 'memory_usage',
        condition: 'gt',
        threshold: 0.85, // 85%
        duration: 300, // 5 minutes
        severity: 'medium',
        channels: ['slack'],
        enabled: true,
      },
      {
        id: 'low_order_completion',
        name: 'Low Order Completion Rate',
        metric: 'order_completion_rate',
        condition: 'lt',
        threshold: 0.8, // 80%
        duration: 1800, // 30 minutes
        severity: 'high',
        channels: ['email', 'slack'],
        enabled: true,
      },
    ];
  }

  // Record a metric
  async recordMetric(data: MetricData): Promise<void> {
    const timestamp = data.timestamp || Date.now();
    const key = `metric:${data.name}:${timestamp}`;
    
    try {
      // Store metric in cache with TTL
      monitoringCache.set(key, {
        ...data,
        timestamp,
      }, 86400000); // 24 hours

      // Check alert rules
      await this.checkAlertRules(data);
      
      // Update aggregated metrics
      await this.updateAggregatedMetrics(data);
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }

  // Record multiple metrics
  async recordMetrics(metrics: MetricData[]): Promise<void> {
    await Promise.all(metrics.map(metric => this.recordMetric(metric)));
  }

  // Record API performance metrics
  async recordAPIMetric(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    userId?: string
  ): Promise<void> {
    const tags: Record<string, string> = {
      endpoint,
      method,
      status_code: statusCode.toString(),
    };

    if (userId) {
      tags.user_id = userId;
    }

    await this.recordMetric({
      name: 'api_response_time',
      value: responseTime,
      tags,
    });

    // Record request count
    await this.recordMetric({
      name: 'api_requests_total',
      value: 1,
      tags,
    });

    // Record error if status code indicates error
    if (statusCode >= 400) {
      await this.recordMetric({
        name: 'api_errors_total',
        value: 1,
        tags,
      });
    }
  }

  // Record business metrics
  async recordBusinessMetrics(metrics: Partial<BusinessMetrics>): Promise<void> {
    const timestamp = Date.now();
    
    for (const [key, value] of Object.entries(metrics)) {
      if (value !== undefined) {
        await this.recordMetric({
          name: key,
          value,
          tags: { type: 'business' },
          timestamp,
        });
      }
    }
  }

  // Record system health check
  async recordSystemHealth(health: SystemHealth): Promise<void> {
    const timestamp = Date.now();
    
    // Record overall health status
    await this.recordMetric({
      name: 'system_health',
      value: health.status === 'healthy' ? 1 : 0,
      tags: { status: health.status },
      timestamp,
    });

    // Record individual service health
    for (const [service, isHealthy] of Object.entries(health.checks)) {
      await this.recordMetric({
        name: 'service_health',
        value: isHealthy ? 1 : 0,
        tags: { service },
        timestamp,
      });
    }

    // Record uptime
    await this.recordMetric({
      name: 'system_uptime',
      value: health.uptime,
      tags: { version: health.version },
      timestamp,
    });
  }

  // Check alert rules and trigger alerts
  private async checkAlertRules(metric: MetricData): Promise<void> {
    const relevantRules = this.alertRules.filter(rule => 
      rule.enabled && rule.metric === metric.name
    );

    for (const rule of relevantRules) {
      const shouldAlert = this.evaluateCondition(metric.value, rule.condition, rule.threshold);
      
      if (shouldAlert) {
        await this.triggerAlert(rule, metric);
      }
    }
  }

  // Evaluate alert condition
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  // Trigger an alert
  private async triggerAlert(rule: AlertRule, metric: MetricData): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      metric: metric.name,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity,
      message: `${rule.name}: ${metric.name} = ${metric.value} (threshold: ${rule.threshold})`,
      timestamp: Date.now(),
      resolved: false,
    };

    this.activeAlerts.push(alert);

    // Store alert in cache
    monitoringCache.set(`alert:${alert.id}`, alert, 604800000); // 7 days

    // Send notifications
    await this.sendAlertNotifications(alert, rule);
  }

  // Send alert notifications
  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channel of rule.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alert, rule);
            break;
          case 'slack':
            await this.sendSlackAlert(alert, rule);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, rule);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} alert:`, error);
      }
    }
  }

  // Send email alert
  private async sendEmailAlert(alert: Alert, rule: AlertRule): Promise<void> {
    try {
      const emailService = process.env.EMAIL_SERVICE || 'resend';
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        console.error('Email API key not configured');
        return;
      }

      const emailData = {
        from: process.env.ALERT_FROM_EMAIL || 'alerts@cribnosh.com',
        to: rule.emailRecipients || [process.env.ADMIN_EMAIL || 'admin@cribnosh.com'],
        subject: `[${rule.severity.toUpperCase()}] ${alert.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${rule.severity === 'critical' ? '#dc2626' : rule.severity === 'warning' ? '#f59e0b' : '#059669'};">
              ${alert.title}
            </h2>
            <p><strong>Severity:</strong> ${rule.severity.toUpperCase()}</p>
            <p><strong>Message:</strong> ${alert.message}</p>
            <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            <p><strong>Service:</strong> ${alert.service}</p>
            <p><strong>Metric:</strong> ${alert.metric}</p>
            <p><strong>Value:</strong> ${alert.value}</p>
            <p><strong>Threshold:</strong> ${rule.threshold}</p>
            ${alert.metadata ? `<p><strong>Additional Info:</strong> ${JSON.stringify(alert.metadata, null, 2)}</p>` : ''}
            <hr>
            <p style="color: #6b7280; font-size: 12px;">
              This alert was generated by CribNosh Monitoring System
            </p>
          </div>
        `
      };

      if (emailService === 'resend') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        });

        if (!response.ok) {
          throw new Error(`Email service responded with status: ${response.status}`);
        }
      }

      console.log(`Email alert sent successfully for rule: ${rule.name}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  // Send Slack alert
  private async sendSlackAlert(alert: Alert, rule: AlertRule): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.error('Slack webhook URL not configured');
        return;
      }

      const color = rule.severity === 'critical' ? '#dc2626' : 
                   rule.severity === 'warning' ? '#f59e0b' : '#059669';

      const slackMessage = {
        text: `${rule.severity.toUpperCase()} Alert: ${alert.title}`,
        attachments: [
          {
            color: color,
            fields: [
              {
                title: 'Service',
                value: alert.service,
                short: true
              },
              {
                title: 'Metric',
                value: alert.metric,
                short: true
              },
              {
                title: 'Value',
                value: alert.value.toString(),
                short: true
              },
              {
                title: 'Threshold',
                value: rule.threshold.toString(),
                short: true
              },
              {
                title: 'Message',
                value: alert.message,
                short: false
              },
              {
                title: 'Timestamp',
                value: new Date(alert.timestamp).toLocaleString(),
                short: true
              }
            ],
            footer: 'CribNosh Monitoring System',
            ts: Math.floor(alert.timestamp / 1000)
          }
        ]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook responded with status: ${response.status}`);
      }

      console.log(`Slack alert sent successfully for rule: ${rule.name}`);
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // Send webhook alert
  private async sendWebhookAlert(alert: Alert, rule: AlertRule): Promise<void> {
    try {
      const webhookUrls = rule.webhookUrls || [process.env.ALERT_WEBHOOK_URL];

      if (!webhookUrls.length || !webhookUrls[0]) {
        console.error('No webhook URLs configured');
        return;
      }

      const webhookPayload = {
        alert: {
          id: alert.id,
          title: alert.title,
          message: alert.message,
          severity: rule.severity,
          service: alert.service,
          metric: alert.metric,
          value: alert.value,
          threshold: rule.threshold,
          timestamp: alert.timestamp,
          metadata: alert.metadata
        },
        rule: {
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          enabled: rule.enabled
        },
        source: 'CribNosh Monitoring System'
      };

      // Send to all configured webhook URLs
      const webhookPromises = webhookUrls.filter((url): url is string => !!url).map(async (url: string) => {
        if (!url) return;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'CribNosh-Monitoring/1.0'
            },
            body: JSON.stringify(webhookPayload),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Webhook responded with status: ${response.status}`);
          }

          console.log(`Webhook alert sent successfully to: ${url}`);
        } catch (error) {
          console.error(`Failed to send webhook alert to ${url}:`, error);
        }
      });

      await Promise.allSettled(webhookPromises);
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  // Update aggregated metrics
  private async updateAggregatedMetrics(metric: MetricData): Promise<void> {
    const key = `aggregated:${metric.name}`;
    
    try {
      const existing = monitoringCache.get<AggregatedMetric>(key);
      const aggregated = existing || {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        lastUpdate: Date.now(),
      };

      aggregated.count++;
      aggregated.sum += metric.value;
      aggregated.min = Math.min(aggregated.min, metric.value);
      aggregated.max = Math.max(aggregated.max, metric.value);
      aggregated.lastUpdate = Date.now();

      monitoringCache.set(key, aggregated, 3600000); // 1 hour
    } catch (error) {
      console.error('Failed to update aggregated metrics:', error);
    }
  }

  // Get system health
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const checks = {
        database: await this.checkDatabaseHealth(),
        stripe: await this.checkStripeHealth(),
        agora: await this.checkAgoraHealth(),
        external_apis: await this.checkExternalAPIsHealth(),
      };

      const healthyChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyChecks === totalChecks) {
        status = 'healthy';
      } else if (healthyChecks >= totalChecks * 0.8) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        checks,
        lastCheck: Date.now(),
        uptime: process.uptime() * 1000,
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        status: 'unhealthy',
        checks: {
          database: false,
          stripe: false,
          agora: false,
          external_apis: false,
        },
        lastCheck: Date.now(),
        uptime: process.uptime() * 1000,
        version: process.env.npm_package_version || '1.0.0',
      };
    }
  }

  // Health check methods
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // This would check your Convex database connection
      // Real health check implementation
      try {
        // Check if database is accessible
        const convex = getConvexClient();
        // Test with a simple query that doesn't require a specific user ID
        const testQuery = await convex.query(api.queries.users.getAll, {});
        return true;
      } catch (error) {
        console.error('Database health check failed:', error);
        return false;
      }
    } catch (error) {
      return false;
    }
  }


  private async checkStripeHealth(): Promise<boolean> {
    try {
      // Check Stripe API connectivity
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Test Stripe API with a simple request
      await stripe.balance.retrieve();
      return true;
    } catch (error) {
      console.error('Stripe health check failed:', error);
      return false;
    }
  }

  private async checkAgoraHealth(): Promise<boolean> {
    try {
      // Check Agora API connectivity
      const agoraAppId = process.env.AGORA_APP_ID;
      const agoraAppCertificate = process.env.AGORA_APP_CERTIFICATE;
      
      if (!agoraAppId || !agoraAppCertificate) {
        console.warn('Agora credentials not configured');
        return false;
      }
      
      // Test Agora API with a simple token generation request
      const agora = require('agora-access-token');
      const token = agora.RtcTokenBuilder.buildTokenWithUid(
        agoraAppId,
        agoraAppCertificate,
        'test-channel',
        0,
        agora.RtcRole.PUBLISHER,
        3600
      );
      
      return token && token.length > 0;
    } catch (error) {
      console.error('Agora health check failed:', error);
      return false;
    }
  }

  private async checkExternalAPIsHealth(): Promise<boolean> {
    try {
      // Check external API dependencies
      const checks = await Promise.allSettled([
        this.checkEmailServiceHealth(),
        this.checkSMSServiceHealth(),
        this.checkFileStorageHealth()
      ]);
      
      // Return true if at least 2 out of 3 services are healthy
      const healthyServices = checks.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;
      
      return healthyServices >= 2;
    } catch (error) {
      console.error('External APIs health check failed:', error);
      return false;
    }
  }

  private async checkEmailServiceHealth(): Promise<boolean> {
    try {
      // Check Resend email service
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        return false;
      }
      
      const response = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${resendApiKey}` }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkSMSServiceHealth(): Promise<boolean> {
    try {
      // Check SMS service configuration
      const smsApiKey = process.env.SMS_API_KEY;
      return !!smsApiKey;
    } catch (error) {
      return false;
    }
  }

  private async checkFileStorageHealth(): Promise<boolean> {
    try {
      // Check file storage service
      const storageUrl = process.env.STORAGE_URL;
      const storageKey = process.env.STORAGE_ACCESS_KEY;
      return !!(storageUrl && storageKey);
    } catch (error) {
      return false;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const metrics = await Promise.all([
        this.getAggregatedMetric('api_response_time'),
        this.getAggregatedMetric('database_query_time'),
        this.getSystemMetrics(),
      ]);

      const systemMetrics = metrics[2] as { memory_usage?: number; cpu_usage?: number; active_connections?: number } | undefined;
      return {
        api_response_time: (metrics[0] as { average?: number } | undefined)?.average || 0,
        database_query_time: (metrics[1] as { average?: number } | undefined)?.average || 0,
        memory_usage: systemMetrics?.memory_usage ?? 0,
        cpu_usage: systemMetrics?.cpu_usage ?? 0,
        active_connections: systemMetrics?.active_connections ?? 0,
        error_rate: await this.calculateErrorRate(),
        request_rate: await this.calculateRequestRate(),
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        api_response_time: 0,
        database_query_time: 0,
        memory_usage: 0,
        cpu_usage: 0,
        active_connections: 0,
        error_rate: 0,
        request_rate: 0,
      };
    }
  }

  // Get aggregated metric
  private async getAggregatedMetric(name: string): Promise<MetricStats | null> {
    try {
      const data = monitoringCache.get<AggregatedMetric>(`aggregated:${name}`);
      if (data) {
        return {
          average: data.sum / data.count,
          min: data.min,
          max: data.max,
          count: data.count,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Get system metrics
  private async getSystemMetrics(): Promise<Record<string, unknown>> {
    const usage = process.memoryUsage();
    return {
      memory_usage: usage.heapUsed / usage.heapTotal,
      cpu_usage: 0, // Would need to implement CPU monitoring
      active_connections: 0, // Would need to implement connection tracking
    };
  }

  // Calculate error rate
  private async calculateErrorRate(): Promise<number> {
    try {
      const totalRequests = await this.getAggregatedMetric('api_requests_total');
      const totalErrors = await this.getAggregatedMetric('api_errors_total');
      
      if (totalRequests && totalErrors && totalRequests.count > 0) {
        return totalErrors.count / totalRequests.count;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Calculate request rate
  private async calculateRequestRate(): Promise<number> {
    try {
      const totalRequests = await this.getAggregatedMetric('api_requests_total');
      if (totalRequests) {
        // Calculate requests per second over the last hour
        return totalRequests.count / 3600;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Get active alerts
  async getActiveAlerts(): Promise<Alert[]> {
    return this.activeAlerts.filter(alert => !alert.resolved);
  }

  // Resolve alert
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      
      // Update in cache
      monitoringCache.set(`alert:${alertId}`, alert, 604800000);
    }
  }

  // Add alert rule
  async addAlertRule(rule: AlertRule): Promise<void> {
    this.alertRules.push(rule);
    monitoringCache.set(`alert_rule:${rule.id}`, rule, 0); // No expiry
  }

  // Update alert rule
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
      monitoringCache.set(`alert_rule:${ruleId}`, this.alertRules[ruleIndex], 0);
    }
  }

  // Delete alert rule
  async deleteAlertRule(ruleId: string): Promise<void> {
    this.alertRules = this.alertRules.filter(r => r.id !== ruleId);
    monitoringCache.delete(`alert_rule:${ruleId}`);
  }

  // Get all alert rules
  async getAlertRules(): Promise<AlertRule[]> {
    return this.alertRules;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService(); 