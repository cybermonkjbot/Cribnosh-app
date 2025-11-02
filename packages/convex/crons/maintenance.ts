import { cronJobs } from "convex/server";
import { api } from "../_generated/api";

// Maintenance cron jobs for Redis migration
export const maintenanceCrons = cronJobs();

// Clean up expired cache entries every hour
maintenanceCrons.interval(
  "cleanup-expired-cache",
  { hours: 1 },
  api.mutations.cache.cleanupExpiredCache,
  {}
);

// Clean up expired sessions every 6 hours
maintenanceCrons.interval(
  "cleanup-expired-sessions",
  { hours: 6 },
  api.mutations.sessions.cleanupExpiredSessions,
  {}
);

// Retry failed jobs every 5 minutes
maintenanceCrons.interval(
  "retry-failed-jobs",
  { minutes: 5 },
  api.mutations.jobQueue.retryFailedJobs,
  {}
);

// Clean up old completed/failed jobs daily
maintenanceCrons.interval(
  "cleanup-old-jobs",
  { hours: 24 },
  api.mutations.jobQueue.cleanupOldJobs,
  {}
);

// Clean up expired presence records daily
maintenanceCrons.interval(
  "cleanup-expired-presence",
  { hours: 24 },
  api.mutations.presence.cleanupExpiredPresence,
  {}
);

// Clean up expired OTPs every hour
maintenanceCrons.interval(
  "cleanup-expired-otps",
  { hours: 1 },
  api.mutations.otp.cleanupExpiredOTPs,
  {}
);

export default maintenanceCrons; 