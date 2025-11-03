import { mutation } from "../_generated/server";
import { v } from 'convex/values';
import type { MutationCtx } from "../../../apps/web/types/convex-contexts";

export const saveAnalyticsEvent = mutation({
  args: {
    event_type: v.string(),
    timestamp: v.number(),
    data: v.optional(v.any()),
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("analytics", {
      eventType: args.event_type,
      timestamp: args.timestamp,
      metadata: args.data ?? {},
      userId: args.user_id,
    });
    return id;
  },
});

export const trackEvent = mutation({
  args: {
    eventType: v.string(),
    timestamp: v.number(),
    metadata: v.any(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analytics", {
      eventType: args.eventType,
      timestamp: args.timestamp,
      metadata: args.metadata,
      userId: args.userId,
    });
  },
});

export const generateReport = mutation({
  args: {
    name: v.string(),
    reportType: v.string(),
    parameters: v.any(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const userIdentity = await ctx.auth.getUserIdentity();
    if (!userIdentity?.subject) {
      throw new Error('User identity not found');
    }
    const createdBy = userIdentity.subject as import("../_generated/dataModel").Id<"users">;
    const reportId = await ctx.db.insert("reports", {
      name: args.name,
      type: args.reportType,
      parameters: args.parameters,
      status: 'generating',
      createdAt: Date.now(),
      createdBy,
    });
    
    // Log the report generation
    await ctx.db.insert("adminActivity", {
      type: "report_generated",
      description: `Report of type ${args.reportType} was generated`,
      timestamp: Date.now(),
      metadata: {
        entityId: reportId,
        entityType: "report",
        details: {
          reportId,
          reportType: args.reportType,
        },
      },
    });
    
    return { success: true, reportId };
  },
});

export const deleteReport = mutation({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.delete(args.reportId);
    return { success: true };
  },
});

export const downloadReport = mutation({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx: MutationCtx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }
    
    // Log the download
    await ctx.db.insert("adminActivity", {
      type: "report_downloaded",
      description: `Report ${report.type} was downloaded`,
      timestamp: Date.now(),
      metadata: {
        entityId: args.reportId,
        entityType: "report",
      },
    });
    
    return { success: true, downloadUrl: `/api/reports/${args.reportId}/download` };
  },
});
