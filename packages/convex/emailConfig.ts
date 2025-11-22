import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// EMAIL TEMPLATE CONFIGURATIONS
// ============================================================================

export const getEmailTemplates = query({
  args: {
    limit: v.optional(v.number()),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      const templates = await ctx.db
        .query("emailTemplates")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .take(args.limit || 50);
      return templates;
    }
    
    const templates = await ctx.db
      .query("emailTemplates")
      .order("desc")
      .take(args.limit || 50);
    
    return templates;
  },
});

export const getEmailTemplate = query({
  args: { templateId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("emailTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
      .first();
    
    return template;
  },
});

export const createEmailTemplate = mutation({
  args: {
    templateId: v.string(),
    name: v.string(),
    isActive: v.boolean(),
    subject: v.string(),
    previewText: v.string(),
    senderName: v.string(),
    senderEmail: v.string(),
    replyToEmail: v.string(),
    htmlContent: v.string(),
    fromEmail: v.optional(v.string()),
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
    changedBy: v.string(),
  },
  returns: v.id("emailTemplates"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if template ID already exists
    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
      .first();
    
    if (existing) {
      throw new Error(`Template with ID ${args.templateId} already exists`);
    }
    
    const templateId = await ctx.db.insert("emailTemplates", {
      templateId: args.templateId,
      name: args.name,
      isActive: args.isActive,
      subject: args.subject,
      previewText: args.previewText,
      senderName: args.senderName,
      senderEmail: args.senderEmail,
      replyToEmail: args.replyToEmail,
      htmlContent: args.htmlContent,
      fromEmail: args.fromEmail,
      customFields: args.customFields,
      styling: args.styling,
      scheduling: args.scheduling,
      targeting: args.targeting,
      testing: args.testing,
      lastModified: now,
      version: 1,
    });
    
    // Log configuration change
    await ctx.db.insert("emailConfigHistory", {
      configType: "template",
      configId: args.templateId,
      action: "created",
      newConfig: args,
      changedBy: args.changedBy,
      timestamp: now,
    });
    
    return templateId;
  },
});

export const updateEmailTemplate = mutation({
  args: {
    templateId: v.string(),
    updates: v.any(),
    changedBy: v.string(),
    changeReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
      .first();
    
    if (!existing) {
      throw new Error(`Template with ID ${args.templateId} not found`);
    }
    
    const now = Date.now();
    const newVersion = (existing.version || 1) + 1;
    
    await ctx.db.patch(existing._id, {
      ...args.updates,
      lastModified: now,
      version: newVersion,
    });
    
    // Log configuration change
    await ctx.db.insert("emailConfigHistory", {
      configType: "template",
      configId: args.templateId,
      action: "updated",
      previousConfig: existing,
      newConfig: args.updates,
      changedBy: args.changedBy,
      changeReason: args.changeReason,
      timestamp: now,
    });
  },
});

export const deleteEmailTemplate = mutation({
  args: {
    templateId: v.string(),
    changedBy: v.string(),
    changeReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId))
      .first();
    
    if (!existing) {
      throw new Error(`Template with ID ${args.templateId} not found`);
    }
    
    await ctx.db.delete(existing._id);
    
    // Log configuration change
    await ctx.db.insert("emailConfigHistory", {
      configType: "template",
      configId: args.templateId,
      action: "deleted",
      previousConfig: existing,
      changedBy: args.changedBy,
      changeReason: args.changeReason,
      timestamp: Date.now(),
    });
  },
});

// ============================================================================
// EMAIL AUTOMATION CONFIGURATIONS
// ============================================================================

export const getEmailAutomations = query({
  args: {
    limit: v.optional(v.number()),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      const automations = await ctx.db
        .query("emailAutomations")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .take(args.limit || 50);
      return automations;
    }
    
    const automations = await ctx.db
      .query("emailAutomations")
      .order("desc")
      .take(args.limit || 50);
    
    return automations;
  },
});

export const getEmailAutomation = query({
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

export const createEmailAutomation = mutation({
  args: {
    automationId: v.string(),
    name: v.string(),
    description: v.string(),
    isActive: v.boolean(),
    triggers: v.array(
      v.object({
        event: v.string(),
        conditions: v.array(
          v.object({
            field: v.string(),
            operator: v.string(),
            value: v.any(),
          })
        ),
        delay: v.number(),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("critical")
        ),
      })
    ),
    templates: v.array(
      v.object({
        templateId: v.string(),
        data: v.record(v.string(), v.any()),
        conditions: v.optional(
          v.array(
            v.object({
              field: v.string(),
              operator: v.string(),
              value: v.any(),
            })
          )
        ),
      })
    ),
    schedule: v.object({
      startDate: v.number(),
      endDate: v.optional(v.number()),
      timezone: v.string(),
    }),
    limits: v.object({
      maxEmailsPerDay: v.number(),
      maxEmailsPerHour: v.number(),
      maxEmailsPerUser: v.number(),
    }),
    changedBy: v.string(),
  },
  returns: v.id("emailAutomations"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if automation ID already exists
    const existing = await ctx.db
      .query("emailAutomations")
      .withIndex("by_automation_id", (q) => q.eq("automationId", args.automationId))
      .first();
    
    if (existing) {
      throw new Error(`Automation with ID ${args.automationId} already exists`);
    }
    
    const automationId = await ctx.db.insert("emailAutomations", {
      automationId: args.automationId,
      name: args.name,
      description: args.description,
      isActive: args.isActive,
      triggers: args.triggers,
      templates: args.templates,
      schedule: args.schedule,
      limits: args.limits,
      lastModified: now,
      version: 1,
    });
    
    // Log configuration change
    await ctx.db.insert("emailConfigHistory", {
      configType: "automation",
      configId: args.automationId,
      action: "created",
      newConfig: args,
      changedBy: args.changedBy,
      timestamp: now,
    });
    
    return automationId;
  },
});

export const updateEmailAutomation = mutation({
  args: {
    automationId: v.string(),
    updates: v.any(),
    changedBy: v.string(),
    changeReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailAutomations")
      .withIndex("by_automation_id", (q) => q.eq("automationId", args.automationId))
      .first();
    
    if (!existing) {
      throw new Error(`Automation with ID ${args.automationId} not found`);
    }
    
    const now = Date.now();
    const newVersion = (existing.version || 1) + 1;
    
    await ctx.db.patch(existing._id, {
      ...args.updates,
      lastModified: now,
      version: newVersion,
    });
    
    // Log configuration change
    await ctx.db.insert("emailConfigHistory", {
      configType: "automation",
      configId: args.automationId,
      action: "updated",
      previousConfig: existing,
      newConfig: args.updates,
      changedBy: args.changedBy,
      changeReason: args.changeReason,
      timestamp: now,
    });
  },
});

export const deleteEmailAutomation = mutation({
  args: {
    automationId: v.string(),
    changedBy: v.string(),
    changeReason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailAutomations")
      .withIndex("by_automation_id", (q) => q.eq("automationId", args.automationId))
      .first();
    
    if (!existing) {
      throw new Error(`Automation with ID ${args.automationId} not found`);
    }
    
    await ctx.db.delete(existing._id);
    
    // Log configuration change
    await ctx.db.insert("emailConfigHistory", {
      configType: "automation",
      configId: args.automationId,
      action: "deleted",
      previousConfig: existing,
      changedBy: args.changedBy,
      changeReason: args.changeReason,
      timestamp: Date.now(),
    });
  },
});

// ============================================================================
// EMAIL BRANDING CONFIGURATIONS
// ============================================================================

export const getEmailBranding = query({
  args: {
    brandId: v.optional(v.string()),
    defaultOnly: v.optional(v.boolean()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    if (args.brandId) {
      const branding = await ctx.db
        .query("emailBranding")
        .withIndex("by_brand_id", (q) => q.eq("brandId", args.brandId!))
        .first();
      return branding;
    }
    
    if (args.defaultOnly) {
      const branding = await ctx.db
        .query("emailBranding")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .first();
      return branding;
    }
    
    // Return first branding config if no specific criteria
    const branding = await ctx.db
      .query("emailBranding")
      .order("desc")
      .first();
    
    return branding;
  },
});

export const createEmailBranding = mutation({
  args: {
    brandId: v.string(),
    name: v.string(),
    isDefault: v.boolean(),
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      success: v.string(),
      warning: v.string(),
      error: v.string(),
      info: v.string(),
      text: v.string(),
      textSecondary: v.string(),
      background: v.string(),
      backgroundSecondary: v.string(),
    }),
    typography: v.object({
      headingFont: v.string(),
      bodyFont: v.string(),
      headingSizes: v.record(v.string(), v.string()),
      bodySizes: v.record(v.string(), v.string()),
    }),
    logo: v.object({
      url: v.string(),
      width: v.number(),
      height: v.number(),
      altText: v.string(),
    }),
    footer: v.object({
      companyName: v.string(),
      address: v.string(),
      phone: v.string(),
      email: v.string(),
      website: v.string(),
      socialLinks: v.array(
        v.object({
          platform: v.string(),
          url: v.string(),
          icon: v.string(),
        })
      ),
      legalLinks: v.array(
        v.object({
          text: v.string(),
          url: v.string(),
        })
      ),
    }),
    spacing: v.object({
      scale: v.array(v.number()),
      defaultPadding: v.string(),
      defaultMargin: v.string(),
    }),
    changedBy: v.string(),
  },
  returns: v.id("emailBranding"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // If setting as default, unset other defaults
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("emailBranding")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .collect();
      
      for (const existing of existingDefaults) {
        await ctx.db.patch(existing._id, { isDefault: false });
      }
    }
    
    const brandingId = await ctx.db.insert("emailBranding", {
      brandId: args.brandId,
      name: args.name,
      isDefault: args.isDefault,
      colors: args.colors,
      typography: args.typography,
      logo: args.logo,
      footer: args.footer,
      spacing: args.spacing,
      lastModified: now,
      version: 1,
    });
    
    // Log configuration change
    await ctx.db.insert("emailConfigHistory", {
      configType: "branding",
      configId: args.brandId,
      action: "created",
      newConfig: args,
      changedBy: args.changedBy,
      timestamp: now,
    });
    
    return brandingId;
  },
});

// ============================================================================
// EMAIL DELIVERY CONFIGURATIONS
// ============================================================================

export const getEmailDelivery = query({
  args: {
    deliveryId: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    if (args.deliveryId) {
      const delivery = await ctx.db
        .query("emailDelivery")
        .withIndex("by_delivery_id", (q) => q.eq("deliveryId", args.deliveryId!))
        .first();
      return delivery;
    }
    
    if (args.activeOnly) {
      const delivery = await ctx.db
        .query("emailDelivery")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .first();
      return delivery;
    }
    
    // Return first delivery config if no specific criteria
    const delivery = await ctx.db
      .query("emailDelivery")
      .order("desc")
      .first();
    
    return delivery;
  },
});

// ============================================================================
// EMAIL ANALYTICS CONFIGURATIONS
// ============================================================================

export const getEmailAnalytics = query({
  args: {
    analyticsId: v.optional(v.string()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    if (args.analyticsId) {
      const analytics = await ctx.db
        .query("emailAnalytics")
        .withIndex("by_analytics_id", (q) => q.eq("analyticsId", args.analyticsId!))
        .first();
      return analytics;
    }
    
    // Return first analytics config if no specific ID
    const analytics = await ctx.db
      .query("emailAnalytics")
      .order("desc")
      .first();
    
    return analytics;
  },
});

// ============================================================================
// EMAIL COMPLIANCE CONFIGURATIONS
// ============================================================================

export const getEmailCompliance = query({
  args: {
    complianceId: v.optional(v.string()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    if (args.complianceId) {
      const compliance = await ctx.db
        .query("emailCompliance")
        .withIndex("by_compliance_id", (q) => q.eq("complianceId", args.complianceId!))
        .first();
      return compliance;
    }
    
    // Return first compliance config if no specific ID
    const compliance = await ctx.db
      .query("emailCompliance")
      .order("desc")
      .first();
    
    return compliance;
  },
});

// ============================================================================
// CONFIGURATION HISTORY
// ============================================================================

export const getEmailConfigHistory = query({
  args: {
    configType: v.optional(v.union(
      v.literal("template"),
      v.literal("automation"),
      v.literal("branding"),
      v.literal("delivery"),
      v.literal("analytics"),
      v.literal("compliance")
    )),
    configId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.configType && args.configId) {
      const history = await ctx.db
        .query("emailConfigHistory")
        .withIndex("by_config_type", (q) => q.eq("configType", args.configType!))
        .filter((q) => q.eq(q.field("configId"), args.configId!))
        .order("desc")
        .take(args.limit || 100);
      return history;
    }
    
    if (args.configType) {
      const history = await ctx.db
        .query("emailConfigHistory")
        .withIndex("by_config_type", (q) => q.eq("configType", args.configType!))
        .order("desc")
        .take(args.limit || 100);
      return history;
    }
    
    if (args.configId) {
      const history = await ctx.db
        .query("emailConfigHistory")
        .withIndex("by_config_id", (q) => q.eq("configId", args.configId!))
        .order("desc")
        .take(args.limit || 100);
      return history;
    }
    
    const history = await ctx.db
      .query("emailConfigHistory")
      .order("desc")
      .take(args.limit || 100);
    
    return history;
  },
});

// ============================================================================
// EMAIL QUEUE MANAGEMENT
// ============================================================================

export const getEmailQueue = query({
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
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.status && args.priority) {
      const queue = await ctx.db
        .query("emailQueue")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .filter((q) => q.eq(q.field("priority"), args.priority!))
        .order("asc")
        .take(args.limit || 100);
      return queue;
    }
    
    if (args.status) {
      const queue = await ctx.db
        .query("emailQueue")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("asc")
        .take(args.limit || 100);
      return queue;
    }
    
    if (args.priority) {
      const queue = await ctx.db
        .query("emailQueue")
        .withIndex("by_priority", (q) => q.eq("priority", args.priority!))
        .order("asc")
        .take(args.limit || 100);
      return queue;
    }
    
    const queue = await ctx.db
      .query("emailQueue")
      .order("asc")
      .take(args.limit || 100);
    
    return queue;
  },
});

export const addToEmailQueue = mutation({
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
    maxAttempts: v.optional(v.number()),
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
      maxAttempts: args.maxAttempts || 3,
    });
    
    return queueId;
  },
});

// ============================================================================
// EMAIL ANALYTICS DATA
// ============================================================================

export const getEmailAnalyticsData = query({
  args: {
    templateId: v.optional(v.string()),
    eventType: v.optional(v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("unsubscribed")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.templateId && args.eventType) {
      const data = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .filter((q) => q.eq(q.field("eventType"), args.eventType!))
        .order("desc")
        .take(args.limit || 1000);
      return data;
    }
    
    if (args.templateId) {
      const data = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .order("desc")
        .take(args.limit || 1000);
      return data;
    }
    
    if (args.eventType) {
      const data = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_event_type", (q) => q.eq("eventType", args.eventType!))
        .order("desc")
        .take(args.limit || 1000);
      return data;
    }
    
    if (args.startDate || args.endDate) {
      const data = await ctx.db
        .query("emailAnalyticsData")
        .withIndex("by_timestamp", (q) => {
          if (args.startDate && args.endDate) {
            return q.gte("timestamp", args.startDate!).lte("timestamp", args.endDate!);
          } else if (args.startDate) {
            return q.gte("timestamp", args.startDate!);
          } else if (args.endDate) {
            return q.lte("timestamp", args.endDate!);
          }
          return q;
        })
        .order("desc")
        .take(args.limit || 1000);
      return data;
    }
    
    const data = await ctx.db
      .query("emailAnalyticsData")
      .order("desc")
      .take(args.limit || 1000);
    
    return data;
  },
});

export const recordEmailEvent = mutation({
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
      deviceInfo: args.deviceInfo,
      locationInfo: args.locationInfo,
    });
    
    return eventId;
  },
});

// ============================================================================
// EMAIL TEST RESULTS
// ============================================================================

export const getEmailTestResults = query({
  args: {
    templateId: v.optional(v.string()),
    testType: v.optional(v.union(
      v.literal("preview"),
      v.literal("validation"),
      v.literal("delivery"),
      v.literal("rendering")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.templateId && args.testType) {
      const results = await ctx.db
        .query("emailTestResults")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .filter((q) => q.eq(q.field("testType"), args.testType!))
        .order("desc")
        .take(args.limit || 100);
      return results;
    }
    
    if (args.templateId) {
      const results = await ctx.db
        .query("emailTestResults")
        .withIndex("by_template_id", (q) => q.eq("templateId", args.templateId!))
        .order("desc")
        .take(args.limit || 100);
      return results;
    }
    
    if (args.testType) {
      const results = await ctx.db
        .query("emailTestResults")
        .withIndex("by_test_type", (q) => q.eq("testType", args.testType!))
        .order("desc")
        .take(args.limit || 100);
      return results;
    }
    
    const results = await ctx.db
      .query("emailTestResults")
      .order("desc")
      .take(args.limit || 100);
    
    return results;
  },
});

export const recordEmailTestResult = mutation({
  args: {
    testId: v.string(),
    templateId: v.string(),
    testType: v.union(
      v.literal("preview"),
      v.literal("validation"),
      v.literal("delivery"),
      v.literal("rendering")
    ),
    testData: v.record(v.string(), v.any()),
    results: v.object({
      success: v.boolean(),
      errors: v.array(v.string()),
      warnings: v.array(v.string()),
      renderTime: v.optional(v.number()),
      validationScore: v.optional(v.number()),
      deliveryStatus: v.optional(v.string()),
    }),
    testedBy: v.string(),
  },
  returns: v.id("emailTestResults"),
  handler: async (ctx, args) => {
    const resultId = await ctx.db.insert("emailTestResults", {
      testId: args.testId,
      templateId: args.templateId,
      testType: args.testType,
      testData: args.testData,
      results: args.results,
      testedBy: args.testedBy,
      timestamp: Date.now(),
    });
    
    return resultId;
  },
});
