import { cronJobs } from "convex/server";
import { internal, api } from "./_generated/api";

const crons = cronJobs();

// Process email queue every minute - updated
crons.interval(
  "process email queue",
  { minutes: 1 },
  internal.emailAutomation.processEmailQueue,
  { batchSize: 10 }
);

// Clean up old analytics data daily
crons.interval(
  "cleanup old analytics data",
  { hours: 24 },
  internal.emailAnalytics.cleanupOldAnalyticsData,
  {}
);

// Generate daily email reports
crons.interval(
  "generate daily email reports",
  { hours: 24 },
  internal.emailAnalytics.generateDailyReports,
  {}
);

// Check email health metrics every 5 minutes
crons.interval(
  "check email health metrics",
  { minutes: 5 },
  internal.emailAnalytics.checkEmailHealthMetrics,
  {}
);

// Clean up expired OTPs every hour
crons.interval(
  "cleanup expired OTPs",
  { hours: 1 },
  api.mutations.otp.cleanupExpiredOTPs as any,
  {}
);

export default crons;
