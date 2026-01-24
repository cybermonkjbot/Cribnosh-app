import { Infer, v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { requireStaff } from "../utils/auth";

// Type definitions for waitlist stats
interface WaitlistStats {
  total: number;
  active: number;
  converted: number;
  inactive: number;
  conversionRate: number;
}

export const getWaitlistStats = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.object({
    total: v.number(),
    active: v.number(),
    converted: v.number(),
    inactive: v.number(),
    conversionRate: v.number(),
  }),
  handler: async (ctx, args: { sessionToken?: string }): Promise<WaitlistStats> => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    const [total, active, converted, inactive] = await Promise.all([
      (ctx.db.query("waitlist") as any).count(),
      (ctx.db.query("waitlist").filter((q: any) => q.eq(q.field("status"), "active")) as any).count(),
      (ctx.db.query("waitlist").filter((q: any) => q.eq(q.field("status"), "converted")) as any).count(),
      (ctx.db.query("waitlist").filter((q: any) => q.eq(q.field("status"), "inactive")) as any).count(),
    ]);

    return {
      total,
      active,
      converted,
      inactive,
      conversionRate: total > 0 ? (converted / total) * 100 : 0
    } as any;
  },
});

// Validator for waitlist details
const waitlistDetailsValidator = v.object({
  _id: v.id("waitlist"),
  email: v.string(),
  name: v.optional(v.string()),
  username: v.optional(v.string()), // Added for provisional users
  phone: v.optional(v.string()),
  location: v.optional(v.string()),
  referralCode: v.optional(v.string()),
  referrer: v.optional(v.id("waitlist")),
  status: v.union(v.literal("active"), v.literal("converted"), v.literal("inactive")),
  joinedAt: v.number(),
  convertedAt: v.optional(v.number()),
  lastNotifiedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  source: v.string(),
  priority: v.string(),
});

export const getWaitlistDetails = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(waitlistDetailsValidator),
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    const { limit, offset = 0 } = args;

    // Use database-level filtering for status (more efficient than in-memory)
    let query = ctx.db.query("waitlist");
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    let waitlist = await query.collect();

    // Search filtering must be done in memory (Convex doesn't support full-text search)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      waitlist = waitlist.filter((entry: Doc<"waitlist">) =>
        entry.email.toLowerCase().includes(searchLower) ||
        entry.name?.toLowerCase().includes(searchLower) ||
        entry.referralCode?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by joinedAt desc (newest first)
    waitlist.sort((a: Doc<"waitlist">, b: Doc<"waitlist">) => (b.joinedAt || 0) - (a.joinedAt || 0));

    // Apply pagination
    const mapped: Infer<typeof waitlistDetailsValidator>[] = waitlist.map((entry: Doc<"waitlist">) => ({
      _id: entry._id,
      email: entry.email,
      name: entry.name,
      username: entry.username,
      phone: entry.phone,
      location: entry.location as string | undefined, // Cast location to string if it matches validator
      referralCode: entry.referralCode,
      referrer: entry.referrer,
      status: (entry.status || 'active') as 'active' | 'converted' | 'inactive',
      joinedAt: entry.joinedAt,
      convertedAt: entry.convertedAt,
      lastNotifiedAt: entry.lastNotifiedAt,
      notes: entry.notes,
      source: entry.source || 'unknown',
      priority: entry.priority || 'normal'
    }));

    if (limit !== undefined) {
      return mapped.slice(offset, offset + limit) as any;
    }

    return mapped.slice(offset) as any;
  },
});

const waitlistEmailCampaignsValidator = v.object({
  _id: v.id("emailCampaigns"),
  name: v.string(),
  status: v.string(),
  subject: v.string(),
  sentCount: v.number(),
  openRate: v.number(),
  clickRate: v.number(),
  createdAt: v.number(),
  lastSent: v.optional(v.number()),
  template: v.string(),
  targetSegment: v.string(),
});

export const getWaitlistEmailCampaigns = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.array(waitlistEmailCampaignsValidator),
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    // Query actual email campaigns from database
    const campaigns = await ctx.db.query("emailCampaigns").collect();

    // Map campaigns to match the expected return format
    const mapped: Infer<typeof waitlistEmailCampaignsValidator>[] = campaigns.map((campaign: Doc<"emailCampaigns">) => ({
      _id: campaign._id,
      name: campaign.name,
      status: campaign.status,
      subject: campaign.subject,
      sentCount: campaign.sentCount,
      openRate: campaign.openRate,
      clickRate: campaign.clickRate,
      createdAt: campaign.createdAt,
      lastSent: campaign.sentAt,
      template: campaign.name.toLowerCase().replace(/\s+/g, '-'), // Derive template name from campaign name
      targetSegment: campaign.recipientType
    }));

    return mapped as any;
  },
});

// Waitlist document validator based on schema
const waitlistDocValidator = v.object({
  _id: v.id("waitlist"),
  _creationTime: v.number(),
  email: v.string(),
  name: v.optional(v.string()),
  username: v.optional(v.string()),
  phone: v.optional(v.string()),
  city: v.optional(v.string()),
  company: v.optional(v.string()),
  teamSize: v.optional(v.string()),
  source: v.optional(v.string()),
  joinedAt: v.number(),
  location: v.optional(v.any()),
  priority: v.optional(v.string()),
  status: v.optional(v.string()),
  addedBy: v.optional(v.id("users")),
  addedByName: v.optional(v.string()),
  referralCode: v.optional(v.string()),
  referrer: v.optional(v.id("waitlist")),
  notes: v.optional(v.string()),
  convertedAt: v.optional(v.number()),
  lastNotifiedAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
  token: v.optional(v.string()),
  creatorType: v.optional(v.string()), // 'taste_creator', 'content_creator', or 'both'
  needsFbaAssistance: v.optional(v.boolean()),
  onboardingCompletedAt: v.optional(v.number()),
});

// Additional functions needed by frontend
export const getAll = query({
  args: {
    sessionToken: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  returns: v.array(waitlistDocValidator),
  handler: async (ctx, args: { sessionToken?: string; limit?: number; offset?: number }) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    const { limit, offset = 0 } = args;

    // Fetch all waitlist entries (will be optimized with index in schema if needed)
    const allEntries = await ctx.db.query("waitlist").collect();

    // Sort by joinedAt desc (newest first)
    allEntries.sort((a: Doc<"waitlist">, b: Doc<"waitlist">) => (b.joinedAt || 0) - (a.joinedAt || 0));

    // Apply pagination
    if (limit !== undefined) {
      return allEntries.slice(offset, offset + limit) as any;
    }

    // If no limit, return all from offset
    return allEntries.slice(offset) as any;
  },
});

export const getById = query({
  args: {
    id: v.id("waitlist"),
    sessionToken: v.optional(v.string())
  },
  returns: v.union(waitlistDocValidator, v.null()),
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    return await ctx.db.get(args.id) as any;
  },
});

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Public query - anyone can check if an email is on the waitlist
    // This is safe as it only returns basic info
    return await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first() as any;
  },
});

export const getByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waitlist")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first() as any;
  },
});

export const getWaitlistCount = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.number(),
  handler: async (ctx, args: { sessionToken?: string }) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    return await (ctx.db.query("waitlist") as any).count();
  },
});

const waitlistEntriesResultValidator = v.object({
  entries: v.array(v.object({
    _id: v.id("waitlist"),
    _creationTime: v.number(),
    email: v.string(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.any()),
    source: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    joinedAt: v.number(),
    notes: v.optional(v.string()),
    addedBy: v.optional(v.id("users")),
    addedByName: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    referrer: v.optional(v.id("waitlist")),
    convertedAt: v.optional(v.number()),
    lastNotifiedAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    city: v.optional(v.string()),
    company: v.optional(v.string()),
    teamSize: v.optional(v.string()),
  })),
  total: v.number(),
});

export const getWaitlistEntries = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()), // Pagination offset
    addedBy: v.optional(v.id("users")), // Filter by staff member who added the entry
    sessionToken: v.optional(v.string())
  },
  returns: waitlistEntriesResultValidator,
  handler: async (ctx, args) => {
    // Require staff authentication
    await requireStaff(ctx, args.sessionToken);

    // Use database-level filtering where possible (more efficient than in-memory)
    let query = ctx.db.query("waitlist");

    // Filter by staff member who added the entry (if provided) - database level
    if (args.addedBy) {
      query = query.filter((q) => q.eq(q.field("addedBy"), args.addedBy));
    }

    // Filter by status - database level
    if (args.status && args.status !== 'all') {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    let entries = await query.collect();

    // Search filtering must be done in memory (Convex doesn't support full-text search)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      entries = entries.filter((entry: Doc<"waitlist">) =>
        entry.email.toLowerCase().includes(searchLower) ||
        (entry.name && entry.name.toLowerCase().includes(searchLower))
      );
    }

    // Sort by joinedAt descending (newest first)
    entries.sort((a: Doc<"waitlist">, b: Doc<"waitlist">) => (b.joinedAt || 0) - (a.joinedAt || 0));

    // Get total count before pagination
    const total = entries.length;

    type WaitlistEntry = Infer<typeof waitlistEntriesResultValidator>["entries"][0];

    // Map entries to match the return type
    const mappedEntries: WaitlistEntry[] = entries.map((entry: Doc<"waitlist">) => ({
      _id: entry._id,
      _creationTime: entry._creationTime,
      email: entry.email,
      name: entry.name,
      username: entry.username,
      phone: entry.phone,
      location: entry.location,
      source: entry.source,
      status: entry.status || 'active',
      priority: entry.priority || 'normal',
      joinedAt: entry.joinedAt,
      notes: entry.notes,
      addedBy: entry.addedBy,
      addedByName: entry.addedByName,
      referralCode: entry.referralCode,
      referrer: entry.referrer,
      convertedAt: entry.convertedAt,
      lastNotifiedAt: entry.lastNotifiedAt,
      updatedAt: entry.updatedAt,
      city: entry.city,
      company: entry.company,
      teamSize: entry.teamSize,
    }));

    // Apply pagination
    const limit = args.limit || 50;
    const offset = args.offset || 0;
    const paginatedEntries = mappedEntries.slice(offset, offset + limit);

    return {
      entries: paginatedEntries,
      total,
    } as any;
  },
});
