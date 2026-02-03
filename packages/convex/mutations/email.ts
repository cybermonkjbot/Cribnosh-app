// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { api } from "../_generated/api";

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

export const initializeCampaignTemplate = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    templateId: v.union(v.id("emailTemplates"), v.null()),
  }),
  handler: async (ctx, args) => {
    // Check if template already exists
    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_template_id", (q) => q.eq("templateId", "campaign-template"))
      .first();
    
    if (existing) {
      return { success: true, templateId: existing._id };
    }
    
    // Create the campaign template with HTML that supports campaign data
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333333;
    }
    .campaign-content {
      font-size: 16px;
      line-height: 1.8;
      color: #555555;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #888888;
      border-top: 1px solid #e9ecef;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>CribNosh</h1>
    </div>
    <div class="content">
      <div class="greeting">
        Hello {{name}},
      </div>
      <div class="campaign-content">
        {{{content}}}
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CribNosh. All rights reserved.</p>
      <p>You're receiving this email because you're part of the CribNosh community.</p>
    </div>
  </div>
</body>
</html>`;

    const templateId = await ctx.runMutation(api.emailConfig.createEmailTemplate, {
      templateId: "campaign-template",
      name: "Campaign Email Template",
      isActive: true,
      subject: "{{subject}}",
      previewText: "{{campaignName}}",
      senderName: "CribNosh",
      senderEmail: "noreply@cribnosh.com",
      replyToEmail: "support@cribnosh.com",
      htmlContent: htmlContent,
      fromEmail: "CribNosh <onboarding@cribnosh.com>",
      customFields: {},
      styling: {
        primaryColor: "#667eea",
        secondaryColor: "#764ba2",
        accent: "#667eea",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
        logoUrl: "https://cribnosh.com/logo.svg",
        footerText: "CribNosh – Personalized Dining, Every Time.",
      },
      scheduling: {
        timezone: "UTC",
        sendTime: "09:00",
        frequency: "immediate",
      },
      targeting: {
        audience: "all",
        segmentId: undefined,
        customFilters: undefined,
      },
      testing: {
        testEmails: [],
        testData: {},
        previewMode: false,
      },
      changedBy: "system",
    });

    return { success: true, templateId };
  },
});
