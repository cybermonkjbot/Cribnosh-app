import { logger } from '@/lib/utils/logger';
import { MonitoringService } from '../monitoring/monitoring.service';
import { ResendProvider } from './providers/resend.provider';
import { EmailTemplateRenderer } from './template-renderer';
import { EmailPayload, EmailProvider } from './types';
import { migrateEmailImagesToConvex } from './utils/convex-image-manager';
import { sanitizeEmailHtml } from './utils/image-validator';

export class EmailServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export class EmailService {
  private provider: EmailProvider;
  private monitoring: MonitoringService;
  private templateRenderer: EmailTemplateRenderer;

  constructor(private config: { resend: { apiKey: string } }) {
    // Initialize monitoring
    this.monitoring = MonitoringService.getInstance();

    // Initialize provider
    this.provider = new ResendProvider(config.resend.apiKey);
    this.templateRenderer = new EmailTemplateRenderer({
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
      defaultUnsubscribeUrl: 'https://cribnosh.co.uk/unsubscribe',
    });
  }

  async send(payload: EmailPayload): Promise<string> {
    // No validation
    // Always use HTML template if not provided
    if (!payload.html) {
      payload.html = await this.templateRenderer.renderGenericNotificationEmail({
        title: payload.subject,
        message: payload.text || '',
      });
    }

    // Migrate all images to Convex storage and validate
    if (payload.html) {
      try {
        // First, migrate all external images to Convex
        const migratedHtml = await migrateEmailImagesToConvex(
          payload.html,
          'email-template'
        );

        // Then validate and remove any broken images
        const sanitized = await sanitizeEmailHtml(migratedHtml, {
          removeBroken: true,
          useFallback: false,
          timeout: 3000,
        });

        if (sanitized.brokenImages.length > 0) {
          logger.warn(`Removed ${sanitized.brokenImages.length} broken image(s) from email`);
          // Track broken images removed
          for (let i = 0; i < sanitized.brokenImages.length; i++) {
            this.monitoring.incrementMetric('email_broken_images_removed');
          }
        }

        payload.html = sanitized.html;
      } catch (error) {
        logger.error('Error processing images in email:', error);
        // Continue with sending even if processing fails
      }
    }

    try {
      const result = await this.provider.send(payload);

      if (!result.success) {
        throw new EmailServiceError(
          'Failed to send email',
          'SEND_ERROR',
          result.error
        );
      }

      this.monitoring.incrementMetric('email_sent_total');
      return result.messageId || '';
    } catch (error) {
      this.monitoring.incrementMetric('email_failed_total');
      throw new EmailServiceError(
        'Failed to send email',
        'SEND_ERROR',
        error as Error
      );
    }
  }

  public getTemplateRenderer() {
    return this.templateRenderer;
  }
}