// @ts-nocheck
/**
 * Compliance Issue Configuration
 * 
 * This file contains all compliance issue definitions and their configurations.
 * This makes it easy to add, modify, or remove compliance issues without
 * touching the main query logic.
 */

export interface ComplianceIssueConfig {
  id: string;
  title: string;
  description: string | ((context: any) => string);
  severity: 'low' | 'medium' | 'high' | 'critical';
  dueDateDays: number; // Days from now to set as due date
  condition: (context: any) => boolean; // Function that determines if issue should be shown
}

export interface ComplianceContext {
  ageVerification: boolean;
  parentalConsent: boolean;
  breachNotification: boolean;
  dpoAppointed: boolean;
  hasDeletionCronJob: boolean;
  hasOverdueDeletions: boolean;
  pendingDeletionsCount: number;
  relatedDataTables: string[];
  hasDeletionProcess: boolean;
}

export const GDPR_COMPLIANCE_ISSUES: ComplianceIssueConfig[] = [
  {
    id: "age-verification",
    title: "Age Verification Not Implemented",
    description: "Age verification is required for users under 16 in GDPR",
    severity: "medium",
    dueDateDays: 90,
    condition: (ctx: ComplianceContext) => !ctx.ageVerification,
  },
  {
    id: "parental-consent",
    title: "Parental Consent Mechanism Missing",
    description: "Parental consent required for users under 16",
    severity: "medium",
    dueDateDays: 90,
    condition: (ctx: ComplianceContext) => !ctx.parentalConsent,
  },
  {
    id: "breach-notification",
    title: "Automated Breach Notification Not Implemented",
    description: "GDPR requires notification within 72 hours of breach detection",
    severity: "high",
    dueDateDays: 60,
    condition: (ctx: ComplianceContext) => !ctx.breachNotification,
  },
  {
    id: "dpo-appointment",
    title: "Data Protection Officer Not Appointed",
    description: "Consider appointing a DPO for better GDPR compliance",
    severity: "low",
    dueDateDays: 180,
    condition: (ctx: ComplianceContext) => !ctx.dpoAppointed,
  },
  {
    id: "deletion-cron-job",
    title: "Automated Account Deletion Processing Not Implemented",
    description: "Account deletions are scheduled but not automatically processed. A cron job is needed to process pending deletions after the retention period.",
    severity: "high",
    dueDateDays: 30,
    condition: (ctx: ComplianceContext) => !ctx.hasDeletionCronJob,
  },
  {
    id: "overdue-deletions",
    title: "Overdue Account Deletions Found",
    description: (ctx: ComplianceContext) => 
      `Found ${ctx.pendingDeletionsCount} account deletion(s) that should have been processed but are still pending. This violates GDPR data retention requirements.`,
    severity: "critical",
    dueDateDays: 7,
    condition: (ctx: ComplianceContext) => ctx.hasOverdueDeletions,
  },
  {
    id: "related-data-cleanup",
    title: "Related Data Cleanup Not Verified",
    description: (ctx: ComplianceContext) =>
      `Related data tables (${ctx.relatedDataTables.join(", ")}) exist but it's unclear if they are properly cleaned up during account deletion. GDPR requires complete data deletion.`,
    severity: "high",
    dueDateDays: 60,
    condition: (ctx: ComplianceContext) => 
      ctx.relatedDataTables.length > 0 && !ctx.hasDeletionProcess,
  },
];

/**
 * Get compliance issue by ID
 */
export function getComplianceIssueById(issueId: string): ComplianceIssueConfig | undefined {
  return GDPR_COMPLIANCE_ISSUES.find(issue => issue.id === issueId);
}

/**
 * Generate issue object from config
 */
export function generateIssueFromConfig(
  config: ComplianceIssueConfig,
  context: ComplianceContext,
  resolvedIssueIds: Set<string>
): any | null {
  // Skip if already resolved
  if (resolvedIssueIds.has(config.id)) {
    return null;
  }
  
  // Check condition
  if (!config.condition(context)) {
    return null;
  }
  
  // Generate description (handle both string and function)
  const description = typeof config.description === 'function' 
    ? config.description(context)
    : config.description;
  
  return {
    id: config.id,
    title: config.title,
    severity: config.severity,
    status: "open" as const,
    description,
    dueDate: Date.now() + (config.dueDateDays * 24 * 60 * 60 * 1000),
  };
}

