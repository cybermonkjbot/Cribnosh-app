import { internalMutation } from "../_generated/server";
import { Crons } from "@convex-dev/crons";
import { internal, components } from "../_generated/api";

const crons = new Crons(components.crons);

export const registerMaintenanceCrons = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Hourly: Clean up expired cache
    await crons.register(
      ctx,
      { kind: "interval", ms: 60 * 60 * 1000 },
      (internal as any)["internal/maintenance"].cleanupExpiredCache,
      {},
      "cleanup-expired-cache"
    );

    // Every 6 hours: Clean up expired sessions
    await crons.register(
      ctx,
      { kind: "interval", ms: 6 * 60 * 60 * 1000 },
      (internal as any)["internal/maintenance"].cleanupExpiredSessions,
      {},
      "cleanup-expired-sessions"
    );

    // Every 5 minutes: Retry failed jobs
    await crons.register(
      ctx,
      { kind: "interval", ms: 5 * 60 * 1000 },
      (internal as any)["internal/maintenance"].retryFailedJobs,
      {},
      "retry-failed-jobs"
    );

    // Daily: Clean up old jobs
    await crons.register(
      ctx,
      { kind: "cron", cronspec: "0 0 * * *" },
      (internal as any)["internal/maintenance"].cleanupOldJobs,
      {},
      "cleanup-old-jobs"
    );

    // Daily: Clean up expired presence records
    await crons.register(
      ctx,
      { kind: "cron", cronspec: "0 1 * * *" }, // 1am every day
      (internal as any)["internal/maintenance"].cleanupExpiredPresence,
      {},
      "cleanup-expired-presence"
    );

    return { success: true, message: "Maintenance crons registered successfully" };
  },
});