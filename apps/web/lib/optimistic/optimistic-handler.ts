import { MonitoringService } from '../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

// In-memory store for optimistic operations (fallback)
const optimisticStore = new Map<string, any>();

export interface OptimisticOperation<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// Example functions to interact with the in-memory store
export function saveOptimisticOperation<T>(op: OptimisticOperation<T>) {
  optimisticStore.set(op.id, op);
}

export function getOptimisticOperation<T>(id: string): OptimisticOperation<T> | undefined {
  return optimisticStore.get(id);
}

export function deleteOptimisticOperation(id: string) {
  optimisticStore.delete(id);
}

export class OptimisticHandler {
  private static instance: OptimisticHandler;
  private processingInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  private constructor() {
    this.startProcessing();
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  public static getInstance(): OptimisticHandler {
    if (!OptimisticHandler.instance) {
      OptimisticHandler.instance = new OptimisticHandler();
    }
    return OptimisticHandler.instance;
  }

  /**
   * Execute an operation optimistically
   */
  async execute<T, R>(
    type: string,
    data: T,
    immediateAction: (data: T) => Promise<R>,
    backgroundAction: (data: T) => Promise<void>
  ): Promise<R> {
    const operationId = `${type}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    
    const operation: OptimisticOperation<T> = {
      id: operationId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    // Store operation
    await this.saveOptimisticOperation(operation);

    // Execute immediate action
    const result = await immediateAction(data);

    // Queue background action
    await this.queueBackgroundAction(operation);

    return result;
  }

  /**
   * Queue an operation for background processing
   */
  private async queueOperation(operation: OptimisticOperation): Promise<void> {
    try {
      saveOptimisticOperation({
        ...operation,
        data: JSON.stringify(operation.data)
      });

      monitoring.incrementMetric('optimistic_operations_queued');
    } catch (error) {
      monitoring.logError(error as Error, {
        context: 'optimistic_queue_operation',
        operationId: operation.id,
        type: operation.type
      });
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    if (this.isShuttingDown) return;
    try {
      // Process in-memory operations
      const now = Date.now();
      const operations = Array.from(optimisticStore.values()).filter(
        (op: any) => op.timestamp <= now && op.status === 'pending'
      );
      
      for (const operation of operations) {
        await this.executeBackgroundAction(operation);
      }
    } catch (error) {
      monitoring.logError(error as Error, { context: 'optimistic_process_queue' });
    }
  }

  private async executeBackgroundAction(operation: OptimisticOperation): Promise<void> {
    // Mark as processing
    operation.status = 'processing';
    await this.saveOptimisticOperation(operation);
    
    try {
      // Execute the background action based on operation type
      // This would be implemented based on the operation type
      operation.status = 'completed';
      operation.error = undefined;
      await this.saveOptimisticOperation(operation);
      monitoring.incrementMetric('optimistic_operations_completed');
      
      // Remove from store after completion
      await this.deleteOptimisticOperation(operation.id);
    } catch (error) {
      const shouldRetry = operation.retryCount < 3;
      if (shouldRetry) {
        operation.retryCount += 1;
        operation.timestamp = Date.now() + Math.pow(2, operation.retryCount) * 1000;
        operation.status = 'pending';
        operation.error = (error as Error).message;
        await this.saveOptimisticOperation(operation);
        monitoring.incrementMetric('optimistic_operations_retried');
      } else {
        operation.status = 'failed';
        operation.error = (error as Error).message;
        await this.saveOptimisticOperation(operation);
        monitoring.incrementMetric('optimistic_operations_failed');
      }
      
      monitoring.logError(error as Error, {
        context: 'optimistic_background_action',
        operationId: operation.id,
        type: operation.type,
        retryCount: operation.retryCount
      });
    }
  }

  private async saveOptimisticOperation(operation: OptimisticOperation): Promise<void> {
    optimisticStore.set(operation.id, operation);
  }

  private async deleteOptimisticOperation(operationId: string): Promise<void> {
    optimisticStore.delete(operationId);
  }

  private async queueBackgroundAction(operation: OptimisticOperation): Promise<void> {
    this.processOperation(operation);
  }

  private async processOperation(operation: OptimisticOperation): Promise<void> {
    // This would be called by the background processor
    // For now, we'll just mark it as completed
    operation.status = 'completed';
    await this.saveOptimisticOperation(operation);
  }

  private startProcessing(): void {
    if (this.processingInterval) return;
    
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    this.stopProcessing();
  }

  /**
   * Get status of an operation
   */
  async getOperationStatus(operationId: string): Promise<OptimisticOperation | null> {
    return optimisticStore.get(operationId) || null;
  }
}