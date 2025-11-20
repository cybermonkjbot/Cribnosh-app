import { v4 as uuidv4 } from 'uuid';
import { EmailPayload, QueuedEmail, RetryConfig } from '../types';
import { RetryStrategy } from '../utils/retry';
import { MonitoringService } from '../../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

// In-memory email queue
const emailQueue: QueuedEmail[] = [];
const processedEmails = new Map<string, { processedAt: Date }>();
const failedEmails = new Map<string, { failedAt: Date; error: string }>();

export class EmailQueue {
  private retryStrategy: RetryStrategy;
  private processingInterval: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;

  constructor(
    private retryConfig: RetryConfig = {
      maxAttempts: 5,
      initialDelay: 1000,
      maxDelay: 60000,
      backoffFactor: 2,
    }
  ) {
    this.retryStrategy = new RetryStrategy(retryConfig);
  }

  private getQueueKey(_status: QueuedEmail['status'] = 'pending'): string {
    return `email:queue:in-memory`;
  }

  async enqueue(email: EmailPayload): Promise<string> {
    const id = uuidv4();
    const queuedEmail: QueuedEmail = {
      id,
      payload: email,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      attempts: 0,
      nextAttempt: new Date(),
    };

    emailQueue.push(queuedEmail);
    monitoring.incrementMetric('email_queued_memory_total');

    return id;
  }

  async dequeue(): Promise<QueuedEmail | null> {
    return emailQueue.shift() || null;
  }

  async getQueueLength(): Promise<number> {
    return emailQueue.length;
  }

  async markAsProcessed(id: string): Promise<void> {
    processedEmails.set(id, { processedAt: new Date() });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    failedEmails.set(id, { failedAt: new Date(), error });
  }

  startProcessing(processor: (email: QueuedEmail) => Promise<void>): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      try {
        const queuedEmail = await this.dequeue();
        if (queuedEmail) {
          await processor(queuedEmail);
        }
      } catch (error) {
        monitoring.logError(error as Error, { context: 'email_queue_processing' });
      }
    }, 1000);
  }

  stopProcessing(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async shutdown(): Promise<void> {
    this.stopProcessing();
  }

  async getQueueStats(): Promise<Record<QueuedEmail['status'], number>> {
    const stats: Record<QueuedEmail['status'], number> = {
      pending: 0,
      processing: 0,
      failed: 0,
      completed: 0,
    };

    emailQueue.forEach(email => {
      if (email.status in stats) {
        stats[email.status]++;
      }
    });

    return stats;
  }

  async cleanup(olderThan: Date): Promise<void> {
    const statuses: QueuedEmail['status'][] = ['completed', 'failed'];
    
    for (const status of statuses) {
      for (const email of emailQueue) {
        if (email.status === status && new Date(email.updatedAt) < olderThan) {
          emailQueue.splice(emailQueue.indexOf(email), 1);
        }
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    // No action needed for in-memory queue
  }
}