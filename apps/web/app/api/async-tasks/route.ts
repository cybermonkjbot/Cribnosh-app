import { NextRequest, NextResponse } from 'next/server';
import { AsyncTaskManager } from '@/lib/api/async-task-manager';
import { ResponseFactory } from '@/lib/api';
import { securityMiddleware } from '@/lib/api/security';
import { withAPIMiddleware } from '@/lib/api/middleware';

/**
 * API endpoint for async task management
 * Handles creation and status checking of long-running tasks
 */
async function handleAsyncTasks(request: NextRequest): Promise<NextResponse> {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return securityMiddleware.applyCORSHeaders(response, request);
  }

  try {
    const taskManager = AsyncTaskManager.getInstance();

    if (request.method === 'POST') {
      // Create new async task
      const body = await request.json();
      const { type, data } = body;

      if (!type) {
        return ResponseFactory.badRequest('Task type is required');
      }

      const task = taskManager.createTask(type, data);

      return ResponseFactory.success({
        taskId: task.id,
        status: task.status,
        createdAt: task.createdAt,
        type: task.type
      }, 'Task created successfully');

    } else if (request.method === 'GET') {
      // Get task status
      const url = new URL(request.url);
      const taskId = url.searchParams.get('taskId');

      if (!taskId) {
        return ResponseFactory.badRequest('Task ID is required');
      }

      const task = taskManager.getTask(taskId);

      if (!task) {
        return ResponseFactory.notFound('Task not found');
      }

      return ResponseFactory.success(task, 'Task status retrieved');

    } else {
      return ResponseFactory.methodNotAllowed('Method not allowed');
    }

  } catch (error) {
    const errorResponse = ResponseFactory.internalError('Failed to process async task request');
    return securityMiddleware.applyCORSHeaders(errorResponse, request);
  }
}

// Export with middleware applied
export const POST = withAPIMiddleware(handleAsyncTasks, {
  enableRateLimit: true,
  enableSecurity: true,
  enableMonitoring: true,
  retryConfig: {
    maxAttempts: 2,
    timeout: 10000  // Shorter timeout for task creation/status checks
  }
});

export const GET = withAPIMiddleware(handleAsyncTasks, {
  enableRateLimit: true,
  enableSecurity: true,
  enableMonitoring: true,
  retryConfig: {
    maxAttempts: 2,
    timeout: 5000  // Very short timeout for status checks
  }
});
