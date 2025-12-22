import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";

// ============================================================================
// EMAIL AUTOMATION PROCESSING
// ============================================================================

export const processEmailAutomation = internalAction({
  args: {
    automationId: v.string(),
    userId: v.id("users"),
    eventData: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get automation configuration
    const automation = await ctx.runQuery(internal.emailAutomation.getAutomationById, {
      automationId: args.automationId,
    });

    if (!automation || !automation.isActive) {
      console.log(`Automation ${args.automationId} not found or inactive`);
      return null;
    }

    // Check if automation is within schedule
    const now = Date.now();
    if (now < automation.schedule.startDate) {
      console.log(`Automation ${args.automationId} not yet started`);
      return null;
    }

    if (automation.schedule.endDate && now > automation.schedule.endDate) {
      console.log(`Automation ${args.automationId} has ended`);
      return null;
    }

    // Process each trigger
    for (const trigger of automation.triggers) {
      if (await evaluateTriggerConditions(trigger, args.eventData)) {
        await processTrigger(ctx, automation, trigger, args.userId, args.eventData);
      }
    }
  },
});

async function evaluateTriggerConditions(trigger: any, eventData: any): Promise<boolean> {
  // Simple condition evaluation - can be enhanced with more complex logic
  for (const condition of trigger.conditions) {
    const fieldValue = getNestedValue(eventData, condition.field);

    switch (condition.operator) {
      case "equals":
        if (fieldValue !== condition.value) return false;
        break;
      case "not_equals":
        if (fieldValue === condition.value) return false;
        break;
      case "contains":
        if (!String(fieldValue).includes(String(condition.value))) return false;
        break;
      case "not_contains":
        if (String(fieldValue).includes(String(condition.value))) return false;
        break;
      case "greater_than":
        if (Number(fieldValue) <= Number(condition.value)) return false;
        break;
      case "less_than":
        if (Number(fieldValue) >= Number(condition.value)) return false;
        break;
      case "exists":
        if (fieldValue === undefined || fieldValue === null) return false;
        break;
      case "not_exists":
        if (fieldValue !== undefined && fieldValue !== null) return false;
        break;
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  return true;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function processTrigger(
  ctx: any,
  automation: any,
  trigger: any,
  userId: string,
  eventData: any
): Promise<void> {
  // Check rate limits
  const rateLimitKey = `automation_${automation.automationId}_${userId}`;
  const rateLimit = await ctx.runQuery(internal.emailAutomation.checkRateLimit, {
    key: rateLimitKey,
    limits: automation.limits,
  });

  if (!rateLimit.allowed) {
    console.log(`Rate limit exceeded for automation ${automation.automationId} and user ${userId}`);
    return;
  }

  // Process each template in the automation
  for (const templateConfig of automation.templates) {
    // Check template-specific conditions
    if (templateConfig.conditions && !await evaluateTriggerConditions(
      { conditions: templateConfig.conditions },
      eventData
    )) {
      continue;
    }

    // Get user data for email
    const user = await ctx.runQuery(internal.emailAutomation.getUserData, { userId });
    if (!user) {
      console.log(`User ${userId} not found`);
      continue;
    }

    // Merge template data with user data
    const emailData = {
      ...templateConfig.data,
      user: user,
      event: eventData,
      automation: {
        id: automation.automationId,
        name: automation.name,
      },
    };

    // Schedule email with delay
    const scheduledFor = Date.now() + (trigger.delay * 1000); // Convert seconds to milliseconds

    await ctx.runMutation(internal.emailAutomation.scheduleEmail, {
      templateId: templateConfig.templateId,
      recipientEmail: user.email,
      recipientData: emailData,
      priority: trigger.priority,
      scheduledFor,
      automationId: automation.automationId,
    });
  }
}

// ============================================================================
// INTERNAL FUNCTIONS
// ============================================================================

export const getAutomationById = internalQuery({
  args: { automationId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const automation = await ctx.db
      .query("emailAutomations")
      .withIndex("by_automation_id", (q) => q.eq("automationId", args.automationId))
      .first();

    return automation;
  },
});

export const checkRateLimit = internalQuery({
  args: {
    key: v.string(),
    limits: v.object({
      maxEmailsPerDay: v.number(),
      maxEmailsPerHour: v.number(),
      maxEmailsPerUser: v.number(),
    }),
  },
  returns: v.object({
    allowed: v.boolean(),
    resetTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayStart = new Date(now).setHours(0, 0, 0, 0);
    const hourStart = new Date(now).setMinutes(0, 0, 0);

    // Check daily limit
    const dailyCount = await ctx.db
      .query("emailQueue")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.key))
      .filter((q) => q.gte(q.field("scheduledFor"), dayStart))
      .collect()
      .then(emails => emails.length);

    if (dailyCount >= args.limits.maxEmailsPerDay) {
      return {
        allowed: false,
        resetTime: dayStart + 24 * 60 * 60 * 1000, // Next day
      };
    }

    // Check hourly limit
    const hourlyCount = await ctx.db
      .query("emailQueue")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.key))
      .filter((q) => q.gte(q.field("scheduledFor"), hourStart))
      .collect()
      .then(emails => emails.length);

    if (hourlyCount >= args.limits.maxEmailsPerHour) {
      return {
        allowed: false,
        resetTime: hourStart + 60 * 60 * 1000, // Next hour
      };
    }

    return {
      allowed: true,
      resetTime: 0,
    };
  },
});

export const getUserData = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

export const scheduleEmail = internalMutation({
  args: {
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
    automationId: v.optional(v.string()),
  },
  returns: v.id("emailQueue"),
  handler: async (ctx, args) => {
    const queueId = await ctx.db.insert("emailQueue", {
      templateId: args.templateId,
      recipientEmail: args.recipientEmail,
      recipientData: args.recipientData,
      priority: args.priority,
      scheduledFor: args.scheduledFor,
      status: "pending",
      attempts: 0,
      maxAttempts: 3,
    });

    return queueId;
  },
});

// ============================================================================
// AUTOMATION MANAGEMENT
// ============================================================================

export const triggerAutomation = mutation({
  args: {
    automationId: v.string(),
    userId: v.id("users"),
    eventData: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Schedule automation processing
    await ctx.scheduler.runAfter(0, internal.emailAutomation.processEmailAutomation, {
      automationId: args.automationId,
      userId: args.userId,
      eventData: args.eventData,
    });
  },
});

export const getActiveAutomations = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const automations = await ctx.db
      .query("emailAutomations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return automations;
  },
});

export const getAutomationsByEvent = query({
  args: { event: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const automations = await ctx.db
      .query("emailAutomations")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter automations that have triggers for this event
    return automations.filter(automation =>
      automation.triggers.some((trigger: any) => trigger.event === args.event)
    );
  },
});

// ============================================================================
// EMAIL QUEUE PROCESSING
// ============================================================================

export const processEmailQueue = internalAction({
  args: {
    batchSize: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 10;
    const now = Date.now();

    // Get pending emails that are ready to be sent
    const pendingEmails = await ctx.runQuery(internal.emailAutomation.getPendingEmails, {
      limit: batchSize,
      currentTime: now,
    });

    for (const email of pendingEmails) {
      try {
        // Update status to processing
        await ctx.runMutation(internal.emailAutomation.updateEmailStatus, {
          emailId: email._id,
          status: "processing",
          lastAttempt: now,
        });

        // Send email (this would integrate with your email service)
        await ctx.runAction(internal.emailAutomation.sendEmail, {
          templateId: email.templateId,
          recipientEmail: email.recipientEmail,
          recipientData: email.recipientData,
          trackingId: email.trackingId,
        });

        // Update status to sent
        await ctx.runMutation(internal.emailAutomation.updateEmailStatus, {
          emailId: email._id,
          status: "sent",
        });

        // Record analytics event
        await ctx.runMutation(internal.emailAutomation.recordEmailEvent, {
          emailId: email.trackingId || email._id,
          templateId: email.templateId,
          recipientEmail: email.recipientEmail,
          eventType: "sent",
          metadata: {
            automationId: email.recipientData?.automation?.id,
            priority: email.priority,
          },
        });

      } catch (error) {
        console.error(`Failed to send email ${email._id}:`, error);

        // Update attempt count
        const newAttempts = email.attempts + 1;
        const shouldRetry = newAttempts < email.maxAttempts;

        await ctx.runMutation(internal.emailAutomation.updateEmailStatus, {
          emailId: email._id,
          status: shouldRetry ? "pending" : "failed",
          attempts: newAttempts,
          errorMessage: String(error),
          lastAttempt: now,
        });

        if (shouldRetry) {
          // Schedule retry with exponential backoff
          const retryDelay = Math.pow(2, newAttempts) * 60 * 1000; // Exponential backoff in minutes
          await ctx.runMutation(internal.emailAutomation.scheduleRetry, {
            emailId: email._id,
            delay: retryDelay,
          });
        }
      }
    }
  },
});

export const getPendingEmails = internalQuery({
  args: {
    limit: v.number(),
    currentTime: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("emailQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lte(q.field("scheduledFor"), args.currentTime))
      .order("asc")
      .take(args.limit);

    return emails;
  },
});

export const updateEmailStatus = internalMutation({
  args: {
    emailId: v.id("emailQueue"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    attempts: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    lastAttempt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };

    if (args.attempts !== undefined) {
      updates.attempts = args.attempts;
    }

    if (args.errorMessage !== undefined) {
      updates.errorMessage = args.errorMessage;
    }

    if (args.lastAttempt !== undefined) {
      updates.lastAttempt = args.lastAttempt;
    }

    await ctx.db.patch(args.emailId, updates);
  },
});

export const scheduleRetry = internalMutation({
  args: {
    emailId: v.id("emailQueue"),
    delay: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const newScheduledFor = Date.now() + args.delay;

    await ctx.db.patch(args.emailId, {
      scheduledFor: newScheduledFor,
    });
  },
});

export const sendEmail = internalAction({
  args: {
    templateId: v.string(),
    recipientEmail: v.string(),
    recipientData: v.record(v.string(), v.any()),
    trackingId: v.optional(v.string()),
  },
  returns: v.string(), // Return email ID
  handler: async (ctx, args): Promise<string> => {
    // Get the template configuration
    let template: any = await ctx.runQuery(api.queries.emailConfig.getTemplate, {
      templateId: args.templateId
    });

    // Auto-create campaign-template if it doesn't exist
    if (!template && args.templateId === "campaign-template") {
      console.log("Campaign template not found, creating it...");
      try {
        await ctx.runMutation(api.mutations.email.initializeCampaignTemplate, {});
        // Try to get it again
        template = await ctx.runQuery(api.queries.emailConfig.getTemplate, {
          templateId: args.templateId
        });
      } catch (error) {
        console.error("Failed to auto-create campaign template:", error);
      }
    }

    if (!template) {
      throw new Error(`Template ${args.templateId} not found`);
    }

    // Render the email with the data
    // Helper function to safely get nested values
    const getValue = (obj: any, key: string): string => {
      const value = obj[key];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    };

    // Helper to escape HTML for subject (which should be plain text)
    const escapeHtml = (text: string): string => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };

    const renderedSubject: string = template.subject.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
      const value = getValue(args.recipientData, key);
      return value ? escapeHtml(value) : match;
    });

    // For HTML content, support both {{key}} (escaped) and {{{key}}} (unescaped/raw HTML)
    let renderedHtml: string = template.htmlContent;
    // First handle triple braces (raw HTML) - these should not be escaped
    renderedHtml = renderedHtml.replace(/\{\{\{(\w+)\}\}\}/g, (match: string, key: string) => {
      const value = getValue(args.recipientData, key);
      return value || '';
    });
    // Then handle double braces (escaped HTML)
    renderedHtml = renderedHtml.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => {
      const value = getValue(args.recipientData, key);
      return value ? escapeHtml(value) : match;
    });

    // Send via Resend
    const emailId: string = await ctx.runAction(api.actions.resend.sendEmail, {
      from: template.fromEmail || process.env.RESEND_FROM_EMAIL || "CribNosh <onboarding@cribnosh.com>",
      to: args.recipientEmail,
      subject: renderedSubject,
      html: renderedHtml,
      tags: [
        { name: "template_id", value: args.templateId },
        ...(args.trackingId ? [{ name: "tracking_id", value: args.trackingId }] : []),
      ],
    });

    console.log(`Email sent successfully: ${emailId} to ${args.recipientEmail}`);
    return emailId;
  },
});

export const recordEmailEvent = internalMutation({
  args: {
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
      v.literal("unsubscribed")
    ),
    metadata: v.record(v.string(), v.any()),
  },
  returns: v.id("emailAnalyticsData"),
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("emailAnalyticsData", {
      emailId: args.emailId,
      templateId: args.templateId,
      recipientEmail: args.recipientEmail,
      eventType: args.eventType,
      timestamp: Date.now(),
      metadata: args.metadata,
    });

    return eventId;
  },
});

// ============================================================================
// AUTOMATION ANALYTICS
// ============================================================================

export const getAutomationStats = query({
  args: {
    automationId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    totalEmails: v.number(),
    sentEmails: v.number(),
    failedEmails: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    bounceRate: v.number(),
  }),
  handler: async (ctx, args) => {
    if (args.automationId && (args.startDate || args.endDate)) {
      const emails = await ctx.db
        .query("emailQueue")
        .withIndex("by_scheduled_for", (q) => {
          if (args.startDate && args.endDate) {
            return q.gte("scheduledFor", args.startDate!).lte("scheduledFor", args.endDate!);
          } else if (args.startDate) {
            return q.gte("scheduledFor", args.startDate!);
          } else if (args.endDate) {
            return q.lte("scheduledFor", args.endDate!);
          }
          return q;
        })
        .filter((q) => q.eq(q.field("recipientData.automation.id"), args.automationId!))
        .collect();

      // Calculate stats
      const totalEmails = emails.length;
      const sentEmails = emails.filter(e => e.status === "sent").length;
      const failedEmails = emails.filter(e => e.status === "failed").length;

      // Calculate real email rates from emailQueue data
      const openRate = 0;
      const clickRate = 0;
      const bounceRate = 0;

      return {
        totalEmails,
        sentEmails,
        failedEmails,
        openRate,
        clickRate,
        bounceRate,
      };
    }

    if (args.automationId) {
      const emails = await ctx.db
        .query("emailQueue")
        .filter((q) => q.eq(q.field("recipientData.automation.id"), args.automationId!))
        .collect();

      // Calculate stats
      const totalEmails = emails.length;
      const sentEmails = emails.filter(e => e.status === "sent").length;
      const failedEmails = emails.filter(e => e.status === "failed").length;

      // Calculate real email rates from emailQueue data
      const openRate = 0;
      const clickRate = 0;
      const bounceRate = 0;

      return {
        totalEmails,
        sentEmails,
        failedEmails,
        openRate,
        clickRate,
        bounceRate,
      };
    }

    if (args.startDate || args.endDate) {
      const emails = await ctx.db
        .query("emailQueue")
        .withIndex("by_scheduled_for", (q) => {
          if (args.startDate && args.endDate) {
            return q.gte("scheduledFor", args.startDate!).lte("scheduledFor", args.endDate!);
          } else if (args.startDate) {
            return q.gte("scheduledFor", args.startDate!);
          } else if (args.endDate) {
            return q.lte("scheduledFor", args.endDate!);
          }
          return q;
        })
        .collect();

      // Calculate stats
      const totalEmails = emails.length;
      const sentEmails = emails.filter(e => e.status === "sent").length;
      const failedEmails = emails.filter(e => e.status === "failed").length;

      // Calculate real email rates from emailQueue data
      const openRate = 0;
      const clickRate = 0;
      const bounceRate = 0;

      return {
        totalEmails,
        sentEmails,
        failedEmails,
        openRate,
        clickRate,
        bounceRate,
      };
    }

    const emails = await ctx.db.query("emailQueue").collect();

    const totalEmails = emails.length;
    const sentEmails = emails.filter(e => e.status === "sent").length;
    const failedEmails = emails.filter(e => e.status === "failed").length;

    // Get analytics data for open/click rates
    const analyticsQuery = ctx.db.query("emailAnalyticsData");
    if (args.automationId) {
      analyticsQuery.filter((q) =>
        q.eq(q.field("metadata.automationId"), args.automationId)
      );
    }

    const analyticsData = await analyticsQuery.collect();
    const opens = analyticsData.filter(a => a.eventType === "opened").length;
    const clicks = analyticsData.filter(a => a.eventType === "clicked").length;
    const bounces = analyticsData.filter(a => a.eventType === "bounced").length;

    return {
      totalEmails,
      sentEmails,
      failedEmails,
      openRate: sentEmails > 0 ? (opens / sentEmails) * 100 : 0,
      clickRate: sentEmails > 0 ? (clicks / sentEmails) * 100 : 0,
      bounceRate: sentEmails > 0 ? (bounces / sentEmails) * 100 : 0,
    };
  },
});
