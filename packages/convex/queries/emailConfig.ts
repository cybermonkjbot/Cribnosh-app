import { query } from "../_generated/server";
import { v } from "convex/values";

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
