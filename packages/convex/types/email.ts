/**
 * Email Template and Analytics Types
 * Type definitions for email templates, analytics, and related structures
 */

import type { Id } from "../_generated/dataModel";

/**
 * Email Template Scheduling Frequency
 */
export type EmailFrequency = "immediate" | "scheduled" | "recurring";

/**
 * Email Template Targeting Audience
 */
export type EmailAudience = "all" | "segment" | "custom";

/**
 * Email Template Styling Configuration
 */
export interface EmailTemplateStyling {
  primaryColor: string;
  secondaryColor: string;
  accent: string;
  fontFamily: string;
  logoUrl: string;
  footerText: string;
}

/**
 * Email Template Scheduling Configuration
 */
export interface EmailTemplateScheduling {
  timezone: string;
  sendTime: string;
  frequency: EmailFrequency;
}

/**
 * Email Template Custom Filter
 */
export interface EmailCustomFilter {
  field: string;
  operator: string;
  value: string | number | boolean | null;
}

/**
 * Email Template Targeting Configuration
 */
export interface EmailTemplateTargeting {
  audience: EmailAudience;
  segmentId?: string;
  customFilters?: EmailCustomFilter[];
}

/**
 * Email Template Testing Configuration
 */
export interface EmailTemplateTesting {
  testEmails: string[];
  testData: Record<string, string | number | boolean | null>;
  previewMode: boolean;
}

/**
 * Email Template Structure
 */
export interface EmailTemplate {
  _id?: Id<"emailTemplates">;
  _creationTime?: number;
  templateId: string;
  name: string;
  isActive: boolean;
  subject: string;
  previewText: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  customFields: Record<string, string | number | boolean | null>;
  styling: EmailTemplateStyling;
  scheduling: EmailTemplateScheduling;
  targeting: EmailTemplateTargeting;
  testing: EmailTemplateTesting;
  lastModified?: number;
  version?: number;
}

/**
 * Email Event Type
 */
export type EmailEventType =
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "bounced"
  | "complained"
  | "unsubscribed"
  | "contact_created"
  | "contact_updated"
  | "contact_deleted"
  | "domain_created"
  | "domain_updated"
  | "domain_deleted";

/**
 * Email Device Information
 */
export interface EmailDeviceInfo {
  type: string;
  os: string;
  browser: string;
  client: string;
}

/**
 * Email Location Information
 */
export interface EmailLocationInfo {
  country: string;
  region: string;
  city: string;
  ipAddress: string;
}

/**
 * Email Analytics Data
 */
export interface EmailAnalyticsData {
  _id?: Id<"emailAnalyticsData">;
  _creationTime?: number;
  emailId: string;
  templateId: string;
  recipientEmail: string;
  eventType: EmailEventType;
  timestamp: number;
  metadata: Record<string, string | number | boolean | null>;
  deviceInfo?: EmailDeviceInfo;
  locationInfo?: EmailLocationInfo;
}

/**
 * Email Test Type
 */
export type EmailTestType = "preview" | "validation" | "delivery" | "rendering";

/**
 * Email Test Results
 */
export interface EmailTestResults {
  success: boolean;
  errors: string[];
  warnings: string[];
  renderTime: number;
  validationScore: number;
  deliveryStatus: string;
}

/**
 * Email Test Data
 */
export interface EmailTestData {
  testId: string;
  templateId: string;
  testType: EmailTestType;
  testData: Record<string, string | number | boolean | null>;
  results: EmailTestResults;
  testedBy: string;
  timestamp: number;
}

/**
 * Email Dashboard Stats
 */
export interface EmailDashboardStats {
  totalEmails: number;
  sentEmails: number;
  deliveredEmails: number;
  openedEmails: number;
  clickedEmails: number;
  bouncedEmails: number;
  unsubscribedEmails: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  deliveryRate: number;
}

/**
 * Email Template Stats
 */
export interface EmailTemplateStats {
  templateId: string;
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

/**
 * Device Analytics Stats
 */
export interface DeviceAnalyticsStats {
  deviceType: string;
  count: number;
  percentage: number;
}

/**
 * Email Health Metrics
 */
export interface EmailHealthMetrics {
  totalEmails: number;
  sentEmails: number;
  deliveredEmails: number;
  openedEmails: number;
  clickedEmails: number;
  bouncedEmails: number;
  unsubscribedEmails: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate?: number;
  deliveryRate: number;
  reputationScore: number;
  queueSize: number;
}

