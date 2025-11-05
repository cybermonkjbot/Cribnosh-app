import { initializeAsyncProcessors } from '@/lib/api/async-processors';
import { MonitoringService } from '@/lib/monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

/**
 * Initialize server-side services
 * This should be called during application startup
 */
export function initializeServerServices(): void {
  try {
    // Initialize async task processors
    initializeAsyncProcessors();
    
    // Set up periodic cleanup for old tasks
    setInterval(() => {
      const { AsyncTaskManager } = require('@/lib/api/async-task-manager');
      const taskManager = AsyncTaskManager.getInstance();
      taskManager.cleanupOldTasks();
    }, 60 * 60 * 1000); // Clean up every hour

    monitoring.logInfo('Server services initialized successfully', {
      services: ['async_processors', 'task_cleanup']
    });

  } catch (error) {
    monitoring.logError(error as Error, {
      context: 'server_initialization'
    });
  }
}

// Auto-initialize if this is the main module
if (require.main === module) {
  initializeServerServices();
}
