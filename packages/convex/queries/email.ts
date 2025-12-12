import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";

// Email campaign document validator based on schema
const emailCampaignDocValidator = v.object({
  _id: v.id("emailCampaigns"),
  _creationTime: v.number(),
  name: v.string(),
  subject: v.string(),
  content: v.string(),
  status: v.union(
    v.literal("draft"),
    v.literal("scheduled"),
    v.literal("sending"),
    v.literal("sent"),
    v.literal("failed")
  ),
  recipientType: v.union(
    v.literal("all"),
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("converted")
  ),
  recipientCount: v.number(),
  sentCount: v.number(),
  openRate: v.number(),
  clickRate: v.number(),
  scheduledFor: v.optional(v.number()),
  sentAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const getEmailCampaigns = query({
  args: {
    status: v.optional(v.string()),
    recipientType: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(emailCampaignDocValidator),
  handler: async (ctx, args) => {
    let campaigns = await ctx.db.query("emailCampaigns").collect();

    if (args.status) {
      campaigns = campaigns.filter((campaign: Doc<"emailCampaigns">) => campaign.status === args.status);
    }

    if (args.recipientType) {
      campaigns = campaigns.filter((campaign: Doc<"emailCampaigns">) => campaign.recipientType === args.recipientType);
    }

    return campaigns;
  },
});

export const getEmailStats = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    draft: v.number(),
    scheduled: v.number(),
    sending: v.number(),
    sent: v.number(),
    failed: v.number(),
    totalSent: v.number(),
    totalRecipients: v.number(),
    avgOpenRate: v.number(),
    avgClickRate: v.number(),
  }),
  handler: async (ctx) => {
    const campaigns = await ctx.db.query("emailCampaigns").collect();

    const total = campaigns.length;
    const draft = campaigns.filter((c: Doc<"emailCampaigns">) => c.status === 'draft').length;
    const scheduled = campaigns.filter((c: Doc<"emailCampaigns">) => c.status === 'scheduled').length;
    const sending = campaigns.filter((c: Doc<"emailCampaigns">) => c.status === 'sending').length;
    const sent = campaigns.filter((c: Doc<"emailCampaigns">) => c.status === 'sent').length;
    const failed = campaigns.filter((c: Doc<"emailCampaigns">) => c.status === 'failed').length;

    const totalSent = campaigns.reduce((sum, c: Doc<"emailCampaigns">) => sum + (c.sentCount || 0), 0);
    const totalRecipients = campaigns.reduce((sum, c: Doc<"emailCampaigns">) => sum + (c.recipientCount || 0), 0);
    const avgOpenRate = campaigns.length > 0
      ? campaigns.reduce((sum, c: Doc<"emailCampaigns">) => sum + (c.openRate || 0), 0) / campaigns.length
      : 0;
    const avgClickRate = campaigns.length > 0
      ? campaigns.reduce((sum, c: Doc<"emailCampaigns">) => sum + (c.clickRate || 0), 0) / campaigns.length
      : 0;

    return {
      total,
      draft,
      scheduled,
      sending,
      sent,
      failed,
      totalSent,
      totalRecipients,
      avgOpenRate,
      avgClickRate,
    };
  },
});

export const getWaitlistStats = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    pending: v.number(),
    approved: v.number(),
    rejected: v.number(),
    converted: v.number(),
    conversionRate: v.number(),
  }),
  handler: async (ctx) => {
    const entries = await ctx.db.query("waitlist").collect();

    const total = entries.length;
    const pending = entries.filter((e: Doc<"waitlist">) => e.status === 'pending').length;
    const approved = entries.filter((e: Doc<"waitlist">) => e.status === 'approved').length;
    const rejected = entries.filter((e: Doc<"waitlist">) => e.status === 'rejected').length;
    const converted = entries.filter((e: Doc<"waitlist">) => e.status === 'converted').length;

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      converted,
      conversionRate,
    };
  },
});

// Email template document validator based on schema
const emailTemplateDocValidator = v.object({
  _id: v.id("emailTemplates"),
  _creationTime: v.number(),
  templateId: v.string(),
  name: v.string(),
  isActive: v.boolean(),
  subject: v.string(),
  previewText: v.string(),
  senderName: v.string(),
  senderEmail: v.string(),
  replyToEmail: v.string(),
  fromEmail: v.optional(v.string()), // Added missing field
  htmlContent: v.optional(v.string()), // Added missing field
  customFields: v.record(v.string(), v.any()),
  styling: v.object({
    primaryColor: v.string(),
    secondaryColor: v.string(),
    accent: v.string(),
    fontFamily: v.string(),
    logoUrl: v.string(),
    footerText: v.string(),
  }),
  scheduling: v.object({
    timezone: v.string(),
    sendTime: v.string(),
    frequency: v.union(
      v.literal("immediate"),
      v.literal("scheduled"),
      v.literal("recurring")
    ),
  }),
  targeting: v.object({
    audience: v.union(
      v.literal("all"),
      v.literal("segment"),
      v.literal("custom")
    ),
    segmentId: v.optional(v.string()),
    customFilters: v.optional(
      v.array(
        v.object({
          field: v.string(),
          operator: v.string(),
          value: v.any(),
        })
      )
    ),
  }),
  testing: v.object({
    testEmails: v.array(v.string()),
    testData: v.record(v.string(), v.any()),
    previewMode: v.boolean(),
  }),
  lastModified: v.optional(v.number()),
  version: v.optional(v.number()),
});

export const getEmailTemplates = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(emailTemplateDocValidator),
  handler: async (ctx) => {
    const templates = await ctx.db.query("emailTemplates").collect();

    // If no templates exist, return empty array (templates should be created via mutation)
    return templates;
  },
});

// Email queue document validator based on schema
const emailQueueDocValidator = v.object({
  _id: v.id("emailQueue"),
  _creationTime: v.number(),
  templateId: v.string(),
  recipientEmail: v.string(),
  recipientData: v.record(v.string(), v.any()),
  priority: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  scheduledFor: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("sent"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  attempts: v.number(),
  maxAttempts: v.number(),
  lastAttempt: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  trackingId: v.optional(v.string()),
});

// Admin Email Queue Management
export const getEmailQueueAdmin = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(emailQueueDocValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    let result: Doc<"emailQueue">[];

    if (args.status) {
      const status = args.status;
      result = await ctx.db
        .query("emailQueue")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    } else if (args.priority) {
      const priority = args.priority;
      result = await ctx.db
        .query("emailQueue")
        .withIndex("by_priority", (q) => q.eq("priority", priority))
        .order("desc")
        .take(limit);
    } else {
      result = await ctx.db
        .query("emailQueue")
        .order("desc")
        .take(limit);
    }

    return result;
  },
});

export const getEmailQueueStats = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    pending: v.number(),
    processing: v.number(),
    sent: v.number(),
    failed: v.number(),
    cancelled: v.number(),
    priority: v.object({
      low: v.number(),
      medium: v.number(),
      high: v.number(),
      critical: v.number(),
    }),
    recent24h: v.number(),
  }),
  handler: async (ctx) => {
    const emails = await ctx.db.query("emailQueue").collect();

    const total = emails.length;
    const pending = emails.filter((e: Doc<"emailQueue">) => e.status === 'pending').length;
    const processing = emails.filter((e: Doc<"emailQueue">) => e.status === 'processing').length;
    const sent = emails.filter((e: Doc<"emailQueue">) => e.status === 'sent').length;
    const failed = emails.filter((e: Doc<"emailQueue">) => e.status === 'failed').length;
    const cancelled = emails.filter((e: Doc<"emailQueue">) => e.status === 'cancelled').length;

    // Priority breakdown
    const low = emails.filter((e: Doc<"emailQueue">) => e.priority === 'low').length;
    const medium = emails.filter((e: Doc<"emailQueue">) => e.priority === 'medium').length;
    const high = emails.filter((e: Doc<"emailQueue">) => e.priority === 'high').length;
    const critical = emails.filter((e: Doc<"emailQueue">) => e.priority === 'critical').length;

    // Recent activity (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recent = emails.filter((e: Doc<"emailQueue">) => e._creationTime > oneDayAgo).length;

    return {
      total,
      pending,
      processing,
      sent,
      failed,
      cancelled,
      priority: {
        low,
        medium,
        high,
        critical
      },
      recent24h: recent
    };
  },
});

// Email analytics data document validator based on schema
const emailAnalyticsDataDocValidator = v.object({
  _id: v.id("emailAnalyticsData"),
  _creationTime: v.number(),
  emailId: v.string(),
  templateId: v.string(),
  recipientEmail: v.string(),
  eventType: v.union(
    v.literal("sent"),
    v.literal("delivered"),
    v.literal("opened"),
    v.literal("clicked"),
    v.literal("bounced"),
    v.literal("complained"),
    v.literal("unsubscribed"),
    v.literal("contact_created"),
    v.literal("contact_updated"),
    v.literal("contact_deleted"),
    v.literal("domain_created"),
    v.literal("domain_updated"),
    v.literal("domain_deleted")
  ),
  timestamp: v.number(),
  metadata: v.record(v.string(), v.any()),
  deviceInfo: v.optional(
    v.object({
      type: v.string(),
      os: v.string(),
      browser: v.string(),
      client: v.string(),
    })
  ),
  locationInfo: v.optional(
    v.object({
      country: v.string(),
      region: v.string(),
      city: v.string(),
      ipAddress: v.string(),
    })
  ),
});

export const getEmailHistoryAdmin = query({
  args: {
    eventType: v.optional(v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("unsubscribed")
    )),
    templateId: v.optional(v.string()),
    recipientEmail: v.optional(v.string()),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.array(emailAnalyticsDataDocValidator),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    let events: Doc<"emailAnalyticsData">[];

    if (args.eventType) {
      const eventType = args.eventType;
      events = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_event_type", (q) => q.eq("eventType", eventType))
        .order("desc")
        .take(limit);
    } else if (args.templateId) {
      const templateId = args.templateId;
      events = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_template_id", (q) => q.eq("templateId", templateId))
        .order("desc")
        .take(limit);
    } else if (args.recipientEmail) {
      const recipientEmail = args.recipientEmail;
      events = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_recipient", (q) => q.eq("recipientEmail", recipientEmail))
        .order("desc")
        .take(limit);
    } else {
      events = await ctx.db
        .query("emailAnalyticsData")
        .order("desc")
        .take(limit);
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      events = events.filter((event: Doc<"emailAnalyticsData">) => {
        if (args.startDate && event.timestamp < args.startDate) return false;
        if (args.endDate && event.timestamp > args.endDate) return false;
        return true;
      });
    }

    return events;
  },
});

export const getEmailHistoryStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    total: v.number(),
    sent: v.number(),
    delivered: v.number(),
    opened: v.number(),
    clicked: v.number(),
    bounced: v.number(),
    complained: v.number(),
    unsubscribed: v.number(),
    rates: v.object({
      deliveryRate: v.number(),
      openRate: v.number(),
      clickRate: v.number(),
      bounceRate: v.number(),
      complaintRate: v.number(),
      unsubscribeRate: v.number(),
    }),
    uniqueRecipients: v.number(),
    uniqueTemplates: v.number(),
  }),
  handler: async (ctx, args) => {
    let events = await ctx.db.query("emailAnalyticsData").collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      events = events.filter((event: Doc<"emailAnalyticsData">) => {
        if (args.startDate && event.timestamp < args.startDate) return false;
        if (args.endDate && event.timestamp > args.endDate) return false;
        return true;
      });
    }

    const total = events.length;
    const sent = events.filter((e: Doc<"emailAnalyticsData">) => e.eventType === 'sent').length;
    const delivered = events.filter((e: Doc<"emailAnalyticsData">) => e.eventType === 'delivered').length;
    const opened = events.filter((e: Doc<"emailAnalyticsData">) => e.eventType === 'opened').length;
    const clicked = events.filter((e: Doc<"emailAnalyticsData">) => e.eventType === 'clicked').length;
    const bounced = events.filter((e: Doc<"emailAnalyticsData">) => e.eventType === 'bounced').length;
    const complained = events.filter((e: Doc<"emailAnalyticsData">) => e.eventType === 'complained').length;
    const unsubscribed = events.filter((e: Doc<"emailAnalyticsData">) => e.eventType === 'unsubscribed').length;

    // Calculate rates
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
    const complaintRate = delivered > 0 ? (complained / delivered) * 100 : 0;
    const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

    // Get unique recipients
    const uniqueRecipients = new Set(events.map((e: Doc<"emailAnalyticsData">) => e.recipientEmail)).size;

    // Get unique templates
    const uniqueTemplates = new Set(events.map((e: Doc<"emailAnalyticsData">) => e.templateId)).size;

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      unsubscribed,
      rates: {
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        complaintRate: Math.round(complaintRate * 100) / 100,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
      },
      uniqueRecipients,
      uniqueTemplates
    };
  },
});
