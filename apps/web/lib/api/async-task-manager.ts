import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { MonitoringService } from '@/lib/monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

export interface AsyncTask {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  result?: unknown;
  error?: string;
  progress?: number;
}

export interface AsyncTaskProcessor {
  process(task: AsyncTask): Promise<AsyncTask>;
  getEstimatedDuration(): number; // in milliseconds
}

// In-memory task store (in production, use Redis or database)
const taskStore = new Map<string, AsyncTask>();

/**
 * Async Task Manager for handling long-running operations
 * Prevents App Runner timeouts by processing tasks asynchronously
 */
export class AsyncTaskManager {
  private static instance: AsyncTaskManager;
  private processors = new Map<string, AsyncTaskProcessor>();

  static getInstance(): AsyncTaskManager {
    if (!AsyncTaskManager.instance) {
      AsyncTaskManager.instance = new AsyncTaskManager();
    }
    return AsyncTaskManager.instance;
  }

  /**
   * Register a task processor for a specific task type
   */
  registerProcessor(type: string, processor: AsyncTaskProcessor): void {
    this.processors.set(type, processor);
  }

  /**
   * Create a new async task
   */
  createTask(type: string, data?: unknown): AsyncTask {
    const task: AsyncTask = {
      id: this.generateTaskId(),
      type,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      result: data
    };

    taskStore.set(task.id, task);
    
    // Start processing immediately
    this.processTask(task.id).catch(error => {
      monitoring.logError(error as Error, { 
        context: 'async_task_manager', 
        taskId: task.id,
        taskType: type
      });
    });

    return task;
  }

  /**
   * Get task status by ID
   */
  getTask(taskId: string): AsyncTask | null {
    return taskStore.get(taskId) || null;
  }

  /**
   * Process a task asynchronously
   */
  private async processTask(taskId: string): Promise<void> {
    const task = taskStore.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const processor = this.processors.get(task.type);
    if (!processor) {
      task.status = 'failed';
      task.error = `No processor found for task type: ${task.type}`;
      task.updatedAt = new Date();
      taskStore.set(taskId, task);
      return;
    }

    try {
      task.status = 'processing';
      task.updatedAt = new Date();
      taskStore.set(taskId, task);

      // Process the task
      const result = await processor.process(task);
      
      // Update task with result
      task.status = result.status;
      task.result = result.result;
      task.error = result.error;
      task.progress = result.progress;
      task.updatedAt = new Date();
      taskStore.set(taskId, task);

      monitoring.logInfo('Async task completed', {
        taskId,
        taskType: task.type,
        status: task.status,
        duration: Date.now() - task.createdAt.getTime()
      });

    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      taskStore.set(taskId, task);

      monitoring.logError(error as Error, {
        context: 'async_task_processing',
        taskId,
        taskType: task.type
      });
    }
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all registered processors
   */
  getProcessors(): Map<string, AsyncTaskProcessor> {
    return this.processors;
  }

  /**
   * Clean up old completed tasks (run periodically)
   */
  cleanupOldTasks(maxAgeMs: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const now = Date.now();
    for (const [taskId, task] of taskStore.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        if (now - task.createdAt.getTime() > maxAgeMs) {
          taskStore.delete(taskId);
        }
      }
    }
  }
}

