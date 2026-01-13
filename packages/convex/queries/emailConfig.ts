import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";

// Get email template by ID
export const getTemplate = query({
  args: {
    templateId: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("emailTemplates")
      .filter((q) => q.eq(q.field("templateId"), args.templateId))
      .first();

    return template;
  },
});

// Get all email templates
export const getAllTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("emailTemplates")
      .order("desc")
      .collect();

    return templates;
  },
});

// Get email template by name
export const getTemplateByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("emailTemplates")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    return template;
  },
});

// List all templates for the admin UI
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("emailTemplates").collect();
  },
});

// Internal query to get template and context for sending emails
export const getTemplateAndContext = internalQuery({
  args: { emailType: v.string() },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("emailTemplates")
      .withIndex("by_type", (q) => q.eq("emailType", args.emailType))
      .first();

    // Mock app config for now, or fetch from a config table if it exists
    const appConfig = {
      companyAddress: "123 Nosh Lane, Food City",
      logoUrl: "https://cribnosh.com/logo.svg",
    };

    return { template, appConfig };
  },
});
