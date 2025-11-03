import { EmailPayload, EmailResult } from './types';
import { EmailService } from './email.service';
import { OptimisticHandler } from '../optimistic/optimistic-handler';
import { MonitoringService } from '../monitoring/monitoring.service';

export class OptimisticEmailService {
  private static instance: OptimisticEmailService;
  private emailService: EmailService;
  private optimisticHandler: OptimisticHandler;
  private monitoring: MonitoringService;

  private constructor(emailService: EmailService) {
    this.emailService = emailService;
    this.optimisticHandler = OptimisticHandler.getInstance();
    this.monitoring = MonitoringService.getInstance();
  }

  public static getInstance(emailService: EmailService): OptimisticEmailService {
    if (!OptimisticEmailService.instance) {
      OptimisticEmailService.instance = new OptimisticEmailService(emailService);
    }
    return OptimisticEmailService.instance;
  }

  /**
   * Send an email optimistically
   * Returns immediately after validation and queuing
   */
  async sendEmail(payload: EmailPayload): Promise<{ 
    success: boolean;
    operationId: string;
    message: string;
  }> {
    // No validation
    try {
      const result = await this.optimisticHandler.execute<EmailPayload, { operationId: string }>(
        'email:send',
        payload,
        // Immediate action: Just validate and return
        async () => {
          const operationId = `email:${Date.now()}:${Math.random().toString(36).slice(2)}`;
          return { operationId };
        },
        // Background action: Actually send the email
        async (emailData) => {
          await this.emailService.send(emailData);
        }
      );
      return {
        success: true,
        operationId: result.operationId,
        message: 'Email queued successfully'
      };
    } catch (error) {
      this.monitoring.logError(error as Error, {
        context: 'optimistic_email_send',
        payload: {
          to: payload.to,
          subject: payload.subject
        }
      });
      throw error;
    }
  }

  /**
   * Check the status of an email send operation
   */
  async checkEmailStatus(operationId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
  }> {
    try {
      const operation = await this.optimisticHandler.getOperationStatus(operationId);
      
      if (!operation) {
        return {
          status: 'failed',
          error: 'Operation not found'
        };
      }

      return {
        status: operation.status,
        error: operation.error
      };
    } catch (error) {
      this.monitoring.logError(error as Error, {
        context: 'check_email_status',
        operationId
      });

      return {
        status: 'failed',
        error: 'Failed to check email status'
      };
    }
  }

  /**
   * Get metrics about email operations
   */
  async getMetrics(): Promise<{
    queued: number;
    completed: number;
    failed: number;
    processing: number;
  }> {
    const metrics = this.monitoring.getMetrics();
    
    return {
      queued: typeof metrics.optimistic_operations_queued === 'number' ? metrics.optimistic_operations_queued : 0,
      completed: typeof metrics.optimistic_operations_completed === 'number' ? metrics.optimistic_operations_completed : 0,
      failed: typeof metrics.optimistic_operations_failed === 'number' ? metrics.optimistic_operations_failed : 0,
      processing: typeof metrics.optimistic_operations_processing === 'number' ? metrics.optimistic_operations_processing : 0,
    };
  }
} 