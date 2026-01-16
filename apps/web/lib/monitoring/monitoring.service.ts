import { createLogger, format, transports } from 'winston';

export class MonitoringService {
  private static instance: MonitoringService;
  private logger: ReturnType<typeof createLogger>;
  private metrics: Map<string, number | number[]>;

  private constructor() {
    const transportsList = [];

    // Only add file transports if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      transportsList.push(
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' })
      );
    }

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service: 'cribnosh-platform' },
      transports: transportsList,
    });

    // Add console transport in development and test
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        ),
      }));
    }

    this.metrics = new Map();
    this.initializeMetrics();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeMetrics() {
    // Email metrics
    this.metrics.set('email_sent_total', 0);
    this.metrics.set('email_failed_total', 0);
    this.metrics.set('email_retry_total', 0);
    this.metrics.set('email_provider_switch_total', 0);
    this.metrics.set('email_broken_images_removed', 0);



    // Form submission metrics
    this.metrics.set('form_submissions_total', 0);
    this.metrics.set('form_validation_failures_total', 0);

    // Performance metrics
    this.metrics.set('email_send_duration_ms', []);
    this.metrics.set('email_send_duration_ms', []);
  }

  // Logging methods
  public logError(error: Error, context: Record<string, unknown> = {}) {
    this.logger.error({
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  public logInfo(message: string, context: Record<string, unknown> = {}) {
    this.logger.info({
      message,
      ...context,
    });
  }

  public logWarning(message: string, context: Record<string, unknown> = {}) {
    this.logger.warn({
      message,
      ...context,
    });
  }

  // Metric tracking methods
  public incrementMetric(metric: string) {
    const currentValue = this.metrics.get(metric);
    if (typeof currentValue === 'number') {
      this.metrics.set(metric, currentValue + 1);
    }
  }

  public recordDuration(metric: string, durationMs: number) {
    const durations = this.metrics.get(metric);
    if (Array.isArray(durations)) {
      durations.push(durationMs);
      // Keep only last 1000 measurements
      if (durations.length > 1000) {
        durations.shift();
      }
    }
  }

  public getMetrics() {
    const result: Record<string, unknown> = {};

    for (const [key, value] of this.metrics.entries()) {
      if (Array.isArray(value)) {
        // Calculate statistics for duration metrics
        const sorted = [...value].sort((a, b) => a - b);
        result[key] = {
          avg: value.reduce((a, b) => a + b, 0) / value.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          count: value.length,
        };
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  public async healthCheck() {
    const metrics = this.getMetrics();
    const emailFailed = typeof metrics.email_failed_total === 'number' ? metrics.email_failed_total : 0;
    const emailSent = typeof metrics.email_sent_total === 'number' ? metrics.email_sent_total : 1;
    const formFailures = typeof metrics.form_validation_failures_total === 'number' ? metrics.form_validation_failures_total : 0;
    const formSubmissions = typeof metrics.form_submissions_total === 'number' ? metrics.form_submissions_total : 1;

    const errorRate = {
      email: emailFailed / emailSent,
      forms: formFailures / formSubmissions,
    };

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      errorRates: errorRate,
      metrics: {
        email: {
          sent: metrics.email_sent_total,
          failed: metrics.email_failed_total,
          retries: metrics.email_retry_total,
        },
        forms: {
          submissions: metrics.form_submissions_total,
          validationFailures: metrics.form_validation_failures_total,
        },
      },
      performance: {
        emailLatency: metrics.email_send_duration_ms,
      },
    };
  }
} 