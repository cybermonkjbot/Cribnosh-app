import { AsyncTask, AsyncTaskProcessor, AsyncTaskManager } from '@/lib/api/async-task-manager';
import { EmailService } from '@/lib/email/email.service';
import { MonitoringService } from '@/lib/monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

/**
 * Async Email Task Processor
 * Handles email sending asynchronously to prevent App Runner timeouts
 */
export class AsyncEmailProcessor implements AsyncTaskProcessor {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService({
      resend: {
        apiKey: process.env.RESEND_API_KEY!,
      },
    });
  }

  async process(task: AsyncTask): Promise<AsyncTask> {
    try {
      const emailData = (task.result as { emailData: unknown })?.emailData;
      
      if (!emailData) {
        throw new Error('Email data is required');
      }

      interface EmailDataType {
        to: string;
        subject: string;
        data?: { message?: string };
      }

      const typedEmailData = emailData as EmailDataType;

      // Update progress
      task.progress = 25;
      
      // Prepare email
      const { to, subject, data } = typedEmailData;
      
      // Update progress
      task.progress = 50;
      
      // Send email
      const messageId = await this.emailService.send({
        to,
        from: process.env.FROM_EMAIL || 'noreply@cribnosh.co.uk',
        subject,
        html: `<p>${data?.message || 'Email sent successfully'}</p>`,
        text: data?.message || 'Email sent successfully'
      });

      // Update progress
      task.progress = 100;

      return {
        ...task,
        status: 'completed',
        result: {
          messageId,
          success: true
        },
        progress: 100
      };

    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'async_email_processor',
        taskId: task.id
      });

      return {
        ...task,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getEstimatedDuration(): number {
    return 10000; // 10 seconds estimated duration
  }
}

/**
 * Async Data Processing Task Processor
 * Handles heavy data processing operations
 */
export class AsyncDataProcessor implements AsyncTaskProcessor {
  async process(task: AsyncTask): Promise<AsyncTask> {
    try {
      const result = task.result as { data?: unknown; operation?: string } | undefined;
      const { data, operation } = result || {};
      
      if (!data || !operation) {
        throw new Error('Data and operation are required');
      }

      // Simulate data processing with progress updates
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        task.progress = Math.round(((i + 1) / steps) * 100);
      }

      // Process data based on operation type
      let processedData: Record<string, unknown>;
      const dataRecord = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};
      
      switch (operation) {
        case 'transform':
          processedData = this.transformData(dataRecord);
          break;
        case 'validate':
          processedData = this.validateData(dataRecord);
          break;
        case 'aggregate':
          processedData = this.aggregateData(dataRecord);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        ...task,
        status: 'completed',
        result: {
          processedData,
          operation,
          success: true
        },
        progress: 100
      };

    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'async_data_processor',
        taskId: task.id
      });

      return {
        ...task,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getEstimatedDuration(): number {
    return 15000; // 15 seconds estimated duration
  }

  private transformData(data: Record<string, unknown>): Record<string, unknown> {
    // Implement data transformation logic
    return { ...data, transformed: true, timestamp: new Date().toISOString() };
  }

  private validateData(data: Record<string, unknown>): Record<string, unknown> {
    // Implement data validation logic
    return { ...data, validated: true, timestamp: new Date().toISOString() };
  }

  private aggregateData(data: Record<string, unknown>): Record<string, unknown> {
    // Implement data aggregation logic
    return { ...data, aggregated: true, timestamp: new Date().toISOString() };
  }
}

/**
 * Initialize async task processors
 * Call this function during application startup
 */
export function initializeAsyncProcessors(): void {
  const taskManager = AsyncTaskManager.getInstance();
  
  // Register email processor
  taskManager.registerProcessor('email', new AsyncEmailProcessor());
  
  // Register data processor
  taskManager.registerProcessor('data', new AsyncDataProcessor());
  
  monitoring.logInfo('Async task processors initialized', {
    processors: ['email', 'data']
  });
}
