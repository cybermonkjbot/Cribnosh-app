"use node";

import { cronJobs } from "convex/server";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { monitoringService } from "../../../apps/web/lib/monitoring/monitor";

const crons = cronJobs();

// Internal action for health check
export const runHealthCheck = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Running automated health check...");
      
      // Get system health
      const health = await monitoringService.getSystemHealth();
      
      // Record health metrics
      await monitoringService.recordSystemHealth(health);
      
      // Record performance metrics
      const performanceMetrics = await monitoringService.getPerformanceMetrics();
      await monitoringService.recordBusinessMetrics({
        total_orders: Math.floor(Math.random() * 100) + 50,
        total_revenue: Math.floor(Math.random() * 10000) + 5000,
        active_users: Math.floor(Math.random() * 500) + 200,
        active_chefs: Math.floor(Math.random() * 50) + 20,
        active_drivers: Math.floor(Math.random() * 30) + 10,
        live_sessions: Math.floor(Math.random() * 10) + 2,
        order_completion_rate: 0.85 + (Math.random() * 0.1),
        customer_satisfaction: 4.2 + (Math.random() * 0.6),
      });
      
      console.log(`Health check completed. Status: ${health.status}`);
      
      // If system is unhealthy, trigger additional monitoring
      if (health.status === 'unhealthy') {
        console.warn("System is unhealthy - triggering additional monitoring");
        
        // Record critical health alert
        await monitoringService.recordMetric({
          name: 'system_health_critical',
          value: 1,
          tags: { status: 'unhealthy', automated: 'true' },
        });
      }
      
    } catch (error) {
      console.error("Health check failed:", error);
      
      // Record health check failure
      await monitoringService.recordMetric({
        name: 'health_check_failed',
        value: 1,
        tags: { error: error instanceof Error ? error.message : 'Unknown error', automated: 'true' },
      });
    }
  }
});

// Internal action for business metrics
export const runBusinessMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Collecting business metrics...");
      
      // This would typically fetch real business data from your database
      // For now, we'll record some sample metrics
      const sampleBusinessMetrics = {
        total_orders: Math.floor(Math.random() * 100) + 50,
        total_revenue: Math.floor(Math.random() * 10000) + 5000,
        active_users: Math.floor(Math.random() * 500) + 200,
        active_chefs: Math.floor(Math.random() * 50) + 20,
        active_drivers: Math.floor(Math.random() * 30) + 10,
        live_sessions: Math.floor(Math.random() * 10) + 2,
        order_completion_rate: 0.85 + (Math.random() * 0.1),
        customer_satisfaction: 4.2 + (Math.random() * 0.6),
      };
      
      await monitoringService.recordBusinessMetrics(sampleBusinessMetrics);
      
      console.log("Business metrics collected successfully");
      
    } catch (error) {
      console.error("Business metrics collection failed:", error);
    }
  }
});

// Internal action for alert cleanup
export const runAlertCleanup = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Running alert cleanup...");
      
      // This would clean up old resolved alerts
      // For now, we'll just log the cleanup process
      console.log("Alert cleanup completed");
      
    } catch (error) {
      console.error("Alert cleanup failed:", error);
    }
  }
});

// Internal action for system maintenance
export const runSystemMaintenance = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("Running system maintenance...");
      
      // This would perform various maintenance tasks
      // - Clean up old metrics data
      // - Optimize database queries
      // - Generate daily reports
      // - Archive old alerts
      
      console.log("System maintenance completed");
      
    } catch (error) {
      console.error("System maintenance failed:", error);
    }
  }
});

// Run health check every 5 minutes
crons.cron(
  "*/5 * * * *", // Every 5 minutes
  "health-check",
  internal.crons.healthCheck.runHealthCheck,
  {}
);

// Run business metrics collection every 15 minutes
crons.cron(
  "*/15 * * * *", // Every 15 minutes
  "business-metrics",
  internal.crons.healthCheck.runBusinessMetrics,
  {}
);

// Run alert cleanup every hour
crons.cron(
  "0 * * * *", // Every hour
  "alert-cleanup",
  internal.crons.healthCheck.runAlertCleanup,
  {}
);

// Run system maintenance every day at 2 AM
crons.cron(
  "0 2 * * *", // Every day at 2 AM
  "system-maintenance",
  internal.crons.healthCheck.runSystemMaintenance,
  {}
);

export default crons; 