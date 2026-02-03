// @ts-nocheck
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { requireStaff } from "../utils/auth";
import { addToWaitlistInternal } from "../waitlist_utils";

export const addToWaitlist = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    source: v.optional(v.string()),
    addedBy: v.optional(v.id("users")),
    addedByName: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    waitlistId: v.id("waitlist"),
    isExisting: v.boolean(),
    userId: v.optional(v.id("users")),
    token: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    return await addToWaitlistInternal(ctx, args);
  },
});

export const updateWaitlistStatus = mutation({
  args: {
    waitlistId: v.id("waitlist"),
    status: v.union(v.literal("active"), v.literal("converted"), v.literal("inactive")),
    notes: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    const waitlist = await ctx.db.get(args.waitlistId);
    if (!waitlist) {
      throw new Error("Waitlist entry not found");
    }

    const updateData: Record<string, unknown> = {
      status: args.status,
    };

    if (args.status === "converted") {
      updateData.convertedAt = Date.now();
    }

    await ctx.db.patch(args.waitlistId, updateData);

    // Log the status change
    await ctx.db.insert("adminActivity", {
      type: "waitlist_status_change",
      description: `Waitlist entry ${waitlist.email} status changed to ${args.status}`,
      timestamp: Date.now(),
      metadata: {
        entityId: args.waitlistId,
        details: {
          oldStatus: waitlist.status,
          newStatus: args.status,
          notes: args.notes,
        },
      },
    });

    return { success: true };
  },
});

export const createEmailCampaign = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    template: v.string(),
    targetSegment: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    // In a real app, this would create an email campaign record
    console.log("Creating email campaign:", args.name);

    // Log the campaign creation
    await ctx.db.insert("adminActivity", {
      type: "email_campaign_created",
      description: `Email campaign "${args.name}" was created`,
      timestamp: Date.now(),
      metadata: {
        details: {
          campaignName: args.name,
          subject: args.subject,
          template: args.template,
          targetSegment: args.targetSegment,
        },
      },
    });

    return { success: true, campaignId: "new-campaign-id" };
  },
});

export const sendEmailCampaign = mutation({
  args: {
    campaignId: v.string(),
    waitlistIds: v.array(v.id("waitlist")),
    subject: v.string(),
    content: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    // Get waitlist entries
    const waitlistEntries = await Promise.all(
      args.waitlistIds.map(async (id: Id<'waitlist'>) => {
        const entry = await ctx.db.get(id);
        if (!entry) {
          throw new Error(`Waitlist entry ${id} not found`);
        }
        return entry;
      })
    );

    // Queue emails for sending
    const emailPromises = waitlistEntries.map(async (entry) => {
      try {
        // Add email to queue for processing
        await ctx.db.insert("emailQueue", {
          templateId: "waitlist-campaign-template",
          recipientEmail: entry.email,
          recipientData: {
            name: entry.name || entry.email,
            email: entry.email,
            campaignId: args.campaignId,
            subject: args.subject,
            content: args.content,
            location: entry.location,
            referralCode: entry.referralCode,
          },
          priority: "medium",
          scheduledFor: Date.now(),
          status: "pending",
          attempts: 0,
          maxAttempts: 3,
        });
      } catch (error) {
        console.error(`Failed to queue email for ${entry.email}:`, error);
      }
    });

    // Wait for all emails to be queued
    await Promise.all(emailPromises);

    // Update last notified timestamp for all recipients
    for (const waitlistId of args.waitlistIds) {
      await ctx.db.patch(waitlistId, {
        lastNotifiedAt: Date.now(),
      });
    }

    // Log the campaign send
    await ctx.db.insert("adminActivity", {
      type: "email_campaign_sent",
      description: `Email campaign "${args.campaignId}" sent to ${args.waitlistIds.length} recipients`,
      timestamp: Date.now(),
      metadata: {
        entityType: "email_campaign",
        details: {
          campaignId: args.campaignId,
          recipientCount: args.waitlistIds.length,
          subject: args.subject,
        },
      },
    });

    return { success: true, sentCount: args.waitlistIds.length };
  },
});

// Additional functions needed by frontend
export const deleteWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    await ctx.db.delete(args.entryId);
    return { success: true };
  },
});

export const updateWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: v.optional(v.string()),
    addedBy: v.optional(v.id("users")),
    addedByName: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require staff authentication
    const user = await requireStaff(ctx, args.sessionToken);

    // If addedBy is provided, ensure it matches the authenticated user or user is admin
    if (args.addedBy && args.addedBy !== user._id) {
      const { isAdmin } = await import("../utils/auth");
      if (!isAdmin(user)) {
        throw new Error("You can only update entries you added, or you must be an admin");
      }
    }
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.status) updateData.status = args.status;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.priority) updateData.priority = args.priority;
    if (args.addedBy) updateData.addedBy = args.addedBy;
    if (args.addedByName) updateData.addedByName = args.addedByName;

    await ctx.db.patch(args.entryId, updateData);
    return { success: true };
  },
});

export const approveWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    await ctx.db.patch(args.entryId, {
      status: 'approved',
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const rejectWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
    reason: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);
    const updateData: Record<string, unknown> = {
      status: 'rejected',
      updatedAt: Date.now(),
    };

    if (args.reason) {
      updateData.notes = args.reason;
    }

    await ctx.db.patch(args.entryId, updateData);
    return { success: true };
  },
});

export const addBulkWaitlistEntries = mutation({
  args: {
    emails: v.array(v.string()),
    addedBy: v.optional(v.id("users")),
    addedByName: v.optional(v.string()),
    source: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    added: v.number(),
    existing: v.number(),
  }),
  handler: async (ctx, args) => {
    // Require staff authentication
    const user = await requireStaff(ctx, args.sessionToken);

    // Ensure addedBy matches authenticated user if provided
    if (args.addedBy && args.addedBy !== user._id) {
      const { isAdmin } = await import("../utils/auth");
      if (!isAdmin(user)) {
        throw new Error("You can only add entries as yourself, or you must be an admin");
      }
    }
    let addedCount = 0;
    let existingCount = 0;

    for (const email of args.emails) {
      // Check if email already exists
      const existing = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("email"), email))
        .first();

      if (!existing) {
        await ctx.db.insert("waitlist", {
          email,
          name: undefined,
          phone: undefined,
          location: undefined,
          referralCode: undefined,
          referrer: undefined,
          status: "active",
          joinedAt: Date.now(),
          source: args.source || "staff_manual",
          priority: "normal",
          addedBy: args.addedBy,
          addedByName: args.addedByName,
        });
        addedCount++;
      } else {
        existingCount++;
      }
    }

    return { success: true, added: addedCount, existing: existingCount };
  },
});

export const submitWaitlistOnboarding = mutation({
  args: {
    token: v.string(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    creatorType: v.string(), // 'taste_creator', 'content_creator', or 'both'
    needsFbaAssistance: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const entry = await ctx.db
        .query("waitlist")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .first();

      if (!entry) {
        console.error(`Invalid onboarding token: ${args.token}`);
        return { success: false, error: "Invalid token" };
      }

      if (entry.onboardingCompletedAt) {
        console.log(`Onboarding already completed for ${entry.email}`);
        return { success: true }; // Idempotent success
      }

      // Check if username is taken (if provided)
      if (args.username) {
        const usernameTakenUser = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", args.username))
          .first();

        const usernameTakenWaitlist = await ctx.db
          .query("waitlist")
          .withIndex("by_username", (q) => q.eq("username", args.username))
          .filter((q) => q.neq(q.field("_id"), entry._id))
          .first();

        if (usernameTakenUser || usernameTakenWaitlist) {
          console.error(`Username taken: ${args.username}`);
          return { success: false, error: "Username is already taken" };
        }
      }

      await ctx.db.patch(entry._id, {
        name: args.name || entry.name,
        username: args.username,
        creatorType: args.creatorType,
        needsFbaAssistance: args.needsFbaAssistance,
        onboardingCompletedAt: Date.now(),
      });

      // Create provisional user account if it doesn't exist
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", entry.email))
        .first();

      if (!existingUser) {
        await ctx.db.insert("users", {
          email: entry.email,
          name: args.name || entry.name || "User",
          username: args.username,
          source: "waitlist",
          status: "provisional",
          roles: ["user", args.creatorType], // Assign role based on creator type
          onboarding: {
            step: "waitlist_completed",
            completed: false,
            needsFbaAssistance: args.needsFbaAssistance,
          },
          lastModified: Date.now(),
        });
      } else {
        // If user exists, maybe update source if missing?
        // For now, let's leave existing users alone to avoid overwriting active accounts.
      }

      // Queue the welcome email
      await ctx.db.insert("emailQueue", {
        templateId: "welcome-beta-access",
        recipientEmail: entry.email,
        recipientData: {
          name: entry.name || "Creator",
          email: entry.email,
        },
        priority: "high",
        scheduledFor: Date.now(),
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
      });

      return { success: true };
    } catch (error) {
      console.error("Error in submitWaitlistOnboarding:", error);
      // Return a safe error message
      return { success: false, error: "An unexpected error occurred" };
    }
  },
});

// Helper to generate a random token
function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const ensureWaitlistToken = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("ensureWaitlistToken called for:", args.email);
    try {
      // Find entry by email using index
      const entry = await ctx.db
        .query("waitlist")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .unique();

      console.log("Entry found:", entry ? entry._id : "null");

      if (!entry) {
        return null; // Return null if email not found
      }

      if (entry.token) {
        console.log("Token already exists");
        return entry.token;
      }

      // Generate new token for legacy user
      const token = generateToken();
      console.log("Generated new token:", token);

      await ctx.db.patch(entry._id, {
        token,
      });
      console.log("Patch successful");

      return token;
    } catch (e) {
      console.error("Error in ensureWaitlistToken:", e);
      throw new Error("Failed to endure waitlist token: " + (e as Error).message);
    }
  },
});

// Helper to ensure the invitation email template exists
async function ensureWaitlistInvitationTemplate(ctx: any) {
  const templateId = "waitlist-onboarding-invite";

  // Check if template exists
  const existing = await ctx.db
    .query("emailTemplates")
    .withIndex("by_template_id", (q: any) => q.eq("templateId", templateId))
    .first();

  if (existing) {
    return;
  }

  const now = Date.now();
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CribNosh</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #111827;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: #ffffff;
    }
    .container {
      max-width: 100%;
    }
    .logo {
      margin-bottom: 40px;
    }
    .logo img {
      height: 32px;
      width: auto;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin-top: 0;
      margin-bottom: 24px;
      letter-spacing: -0.01em;
    }
    p {
      color: #4B5563;
      margin-bottom: 24px;
      font-size: 16px;
      line-height: 1.6;
    }
    .button-container {
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #ff3b30;
      color: #ffffff;
      padding: 16px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #000000;
    }
    .link-fallback {
      font-size: 14px;
      word-break: break-all;
      color: #6B7280;
      margin-top: 32px;
    }
    .footer {
      border-top: 1px solid #E5E7EB;
      margin-top: 48px;
      padding-top: 32px;
      font-size: 14px;
      color: #9CA3AF;
    }
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-text">CribNosh</div>
  </div>
  
  <div class="container">
    <h1>You're invited</h1>
    <p>Hello {{name}},</p>
    <p>We are delighted to inform you that your waitlist spot has been secured. You can now complete your profile and join our community.</p>
    
    <div class="button-container">
      <a href="https://cribnosh.com/waitlist/onboarding/{{token}}" class="cta-button">Complete Profile</a>
    </div>
    
    <p>We look forward to seeing you.</p>
    <p>The CribNosh Team</p>

    <div class="link-fallback">
      <p>If the button doesn't work, verify your account using this link:</p>
      <a href="https://cribnosh.com/waitlist/onboarding/{{token}}" style="color: #6B7280;">https://cribnosh.com/waitlist/onboarding/{{token}}</a>
    </div>
  </div>

  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} CribNosh. All rights reserved.</p>
  </div>
</body>
</html>`;

  const templateData = {
    templateId: templateId,
    name: "Waitlist Invitation",
    isActive: true,
    subject: "Completing your CribNosh profile",
    previewText: "Your waitlist spot is ready",
    senderName: "CribNosh",
    senderEmail: "control@emails.cribnosh.com",
    replyToEmail: "support@cribnosh.com",
    htmlContent: htmlContent,
    fromEmail: "CribNosh <control@emails.cribnosh.com>",
    customFields: {},
    styling: {
      primaryColor: "#111827",
      secondaryColor: "#ffffff",
      accent: "#111827",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
      logoUrl: "",
      footerText: "CribNosh",
    },
    scheduling: {
      timezone: "UTC",
      sendTime: "09:00",
      frequency: "immediate" as const, // Explicitly cast if needed, or string "immediate"
    },
    targeting: {
      audience: "all" as const,
      segmentId: undefined,
      customFilters: undefined,
    },
    testing: {
      testEmails: [],
      testData: {},
      previewMode: false,
    },
  };

  await ctx.db.insert("emailTemplates", {
    ...templateData,
    lastModified: now,
    version: 1,
  });

  // Log configuration change
  await ctx.db.insert("emailConfigHistory", {
    configType: "template",
    configId: templateId,
    action: "created",
    newConfig: templateData,
    changedBy: "system",
    timestamp: now,
  });
}


export const bulkInviteWaitlistUsers = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    targetEmail: v.optional(v.string()), // For testing specific user
  },
  returns: v.object({
    processed: v.number(),
    tokensGenerated: v.number(),
    emailsQueued: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    // 1. Ensure template exists (only if not dry run, or we can just ensure it anyway)
    if (!args.dryRun) {
      await ensureWaitlistInvitationTemplate(ctx);
    }

    let query = ctx.db.query("waitlist"); // query waitlist

    // If targetEmail is set, filter by that
    if (args.targetEmail) {
      const entries = await query
        .withIndex("by_email", (q) => q.eq("email", args.targetEmail!))
        .collect();

      if (entries.length === 0) {
        throw new Error(`Target email ${args.targetEmail} not found`);
      }
      return await processEntries(ctx, entries, args.dryRun || false);
    }



    // Otherwise fetch all (up to limit)
    // In a real bulk scenario, we might want to paginate or use internal mutation for batches
    // For now, we'll take a safe limit
    const limit = args.limit || 100;
    const entries = await query.order("desc").take(limit);

    return await processEntries(ctx, entries, args.dryRun || false);
  },
});

async function processEntries(ctx: any, entries: any[], dryRun: boolean) {
  let processed = 0;
  let tokensGenerated = 0;
  let emailsQueued = 0;
  let skipped = 0;

  const templateId = "waitlist-onboarding-invite";

  for (const entry of entries) {
    processed++;

    // Skip if already onboarded
    if (entry.onboardingCompletedAt) {
      skipped++;
      continue;
    }

    // Skip if recently notified (e.g., within last 7 days) to avoid spamming
    if (entry.lastNotifiedAt && (Date.now() - entry.lastNotifiedAt < 7 * 24 * 60 * 60 * 1000)) {
      skipped++;
      continue;
    }

    let token = entry.token;
    let tokenUpdated = false;

    // Generator token if missing
    if (!token) {
      token = generateToken();
      if (!dryRun) {
        await ctx.db.patch(entry._id, { token });
      }
      tokenUpdated = true;
      tokensGenerated++;
    }

    // Queue email
    if (!dryRun) {
      await ctx.db.insert("emailQueue", {
        templateId: templateId,
        recipientEmail: entry.email,
        recipientData: {
          name: entry.name || "Food Lover",
          email: entry.email,
          token: token,
          tokenUpdated: tokenUpdated,
        },
        priority: "high",
        scheduledFor: Date.now(),
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
      });

      // Update last notified
      await ctx.db.patch(entry._id, { lastNotifiedAt: Date.now() });
    }

    emailsQueued++;
  }

  return {
    processed,
    tokensGenerated,
    emailsQueued,
    skipped
  };
}
