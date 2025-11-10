import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "../_generated/dataModel";
import { requireStaff, getAuthenticatedUser } from "../utils/auth";

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
  }),
  handler: async (ctx, args) => {
    // Check if email already exists in waitlist
    const existing = await ctx.db
      .query("waitlist")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    // Check if user exists with this email (optimization - return user info if exists)
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    if (existing) {
      // Return existing entry with user info if available
      return { 
        success: true, 
        waitlistId: existing._id,
        isExisting: true,
        userId: existingUser?._id,
      };
    }
    
    const waitlistId = await ctx.db.insert("waitlist", {
      email: args.email,
      name: args.name,
      phone: args.phone,
      location: args.location,
      referralCode: args.referralCode,
      referrer: args.referralCode ? await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("referralCode"), args.referralCode))
        .first()
        .then((entry: Doc<"waitlist"> | null) => entry?._id) : undefined,
      status: "active",
      joinedAt: args.joinedAt || Date.now(),
      source: args.source || "website",
      priority: "normal",
      addedBy: args.addedBy,
      addedByName: args.addedByName,
    });
    
    return { 
      success: true, 
      waitlistId, 
      isExisting: false,
      userId: existingUser?._id, // Return user ID if user already exists
    };
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