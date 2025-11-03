import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

export const createEmailCampaign = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    recipientType: v.union(
      v.literal("all"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("converted")
    ),
    scheduledFor: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    campaignId: v.id("emailCampaigns"),
  }),
  handler: async (ctx, args) => {
    // Get recipient count based on type
    let recipientCount = 0;
    if (args.recipientType === "all") {
      const allEntries = await ctx.db.query("waitlist").collect();
      recipientCount = allEntries.length;
    } else {
      const filteredEntries = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("status"), args.recipientType))
        .collect();
      recipientCount = filteredEntries.length;
    }
    
    const campaignId = await ctx.db.insert("emailCampaigns", {
      name: args.name,
      subject: args.subject,
      content: args.content,
      status: args.scheduledFor ? "scheduled" : "draft",
      recipientType: args.recipientType,
      recipientCount,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      scheduledFor: args.scheduledFor,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, campaignId };
  },
});

export const updateEmailCampaign = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed")
    )),
    scheduledFor: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const { campaignId, ...updates } = args;
    await ctx.db.patch(campaignId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const sendEmailCampaign = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  returns: v.object({
    success: v.boolean(),
    sentCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    
    // Update campaign status to sending
    await ctx.db.patch(args.campaignId, {
      status: "sending",
      updatedAt: Date.now(),
    });
    
    // Get recipients based on campaign type
    let recipients: Doc<"waitlist">[] = [];
    if (campaign.recipientType === "all") {
      recipients = await ctx.db.query("waitlist").collect();
    } else {
      recipients = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("status"), campaign.recipientType))
        .collect();
    }

    // Queue emails for sending
    const emailPromises = recipients.map(async (recipient) => {
      try {
        // Add email to queue for processing
        await ctx.db.insert("emailQueue", {
          templateId: "campaign-template",
          recipientEmail: recipient.email,
          recipientData: {
            name: recipient.name || recipient.email,
            email: recipient.email,
            campaignId: campaign._id,
            campaignName: campaign.name,
            subject: campaign.subject,
            content: campaign.content,
          },
          priority: "medium",
          scheduledFor: Date.now(),
          status: "pending",
          attempts: 0,
          maxAttempts: 3,
        });
      } catch (error) {
        console.error(`Failed to queue email for ${recipient.email}:`, error);
      }
    });

    // Wait for all emails to be queued
    await Promise.all(emailPromises);

    // Update campaign status to sent
    await ctx.db.patch(args.campaignId, {
      status: "sent",
      sentAt: Date.now(),
      sentCount: recipients.length,
      updatedAt: Date.now(),
    });

    // Log the campaign sending activity
    await ctx.db.insert("adminActivity", {
      type: "email_campaign_sent",
      description: `Email campaign "${campaign.name}" sent to ${recipients.length} recipients`,
      timestamp: Date.now(),
      metadata: {
        entityType: "email_campaign",
        details: {
          campaignId: campaign._id,
          campaignName: campaign.name,
          recipientType: campaign.recipientType,
          recipientCount: recipients.length,
          subject: campaign.subject,
        },
      },
    });

    return { success: true, sentCount: recipients.length };
  },
});

export const deleteEmailCampaign = mutation({
  args: {
    campaignId: v.id("emailCampaigns"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.campaignId);
    return { success: true };
  },
});
