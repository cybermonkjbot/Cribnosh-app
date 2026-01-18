import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

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

// Generate daily payment reports
crons.interval(
  "generate daily payment reports",
  { hours: 24 },
  internal.paymentAnalytics.generateDailyReports,
  {}
);

// Check payment health metrics every 5 minutes
crons.interval(
  "check payment health metrics",
  { minutes: 5 },
  internal.paymentAnalytics.checkPaymentHealthMetrics,
  {}
);

// Clean up old payment analytics data daily
crons.interval(
  "cleanup old payment analytics data",
  { hours: 24 },
  internal.paymentAnalytics.cleanupOldPaymentAnalyticsData,
  {}
);

// Clean up expired OTPs every hour
crons.interval(
  "cleanup expired OTPs",
  { hours: 1 },
  api.mutations.otp.cleanupExpiredOTPs as any,
  {}
);

// Clean up expired action cache entries every hour
crons.interval(
  "cleanup expired action cache",
  { hours: 1 },
  internal.mutations.cache.cleanup,
  {}
);

export default crons;
