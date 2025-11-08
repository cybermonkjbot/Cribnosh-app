import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";

// Type definitions for waitlist stats
interface WaitlistStats {
  total: number;
  active: number;
  converted: number;
  inactive: number;
  conversionRate: number;
}

export const getWaitlistStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    active: v.number(),
    converted: v.number(),
    inactive: v.number(),
    conversionRate: v.number(),
  }),
  handler: async (ctx): Promise<WaitlistStats> => {
    const waitlist = await ctx.db.query("waitlist").collect();
    const total = waitlist.length;
    const active = waitlist.filter((entry: Doc<"waitlist">) => entry.status === 'active').length;
    const converted = waitlist.filter((entry: Doc<"waitlist">) => entry.status === 'converted').length;
    const inactive = waitlist.filter((entry: Doc<"waitlist">) => entry.status === 'inactive').length;
    
    return {
      total,
      active,
      converted,
      inactive,
      conversionRate: total > 0 ? (converted / total) * 100 : 0
    };
  },
});

export const getWaitlistDetails = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("waitlist"),
    email: v.string(),
    name: v.optional(v.string()),
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
  })),
  handler: async (ctx, args) => {
    let waitlist = await ctx.db.query("waitlist").collect();
    
    if (args.status) {
      waitlist = waitlist.filter((entry: Doc<"waitlist">) => entry.status === args.status);
    }
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      waitlist = waitlist.filter((entry: Doc<"waitlist">) => 
        entry.email.toLowerCase().includes(searchLower) ||
        entry.name?.toLowerCase().includes(searchLower) ||
        entry.referralCode?.toLowerCase().includes(searchLower)
      );
    }
    
    return waitlist.map((entry: Doc<"waitlist">) => ({
      _id: entry._id,
      email: entry.email,
      name: entry.name,
      phone: entry.phone,
      location: entry.location,
      referralCode: entry.referralCode,
      referrer: entry.referrer,
      status: entry.status as 'active' | 'converted' | 'inactive',
      joinedAt: entry.joinedAt,
      convertedAt: entry.convertedAt,
      lastNotifiedAt: entry.lastNotifiedAt,
      notes: entry.notes,
      source: entry.source || 'unknown',
      priority: entry.priority || 'normal'
    }));
  },
});

export const getWaitlistEmailCampaigns = query({
  args: {},
  returns: v.array(v.object({
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
  })),
  handler: async (ctx) => {
    // Query actual email campaigns from database
    const campaigns = await ctx.db.query("emailCampaigns").collect();
    
    // Map campaigns to match the expected return format
    return campaigns.map((campaign: Doc<"emailCampaigns">) => ({
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
  },
});

// Waitlist document validator based on schema
const waitlistDocValidator = v.object({
  _id: v.id("waitlist"),
  _creationTime: v.number(),
  email: v.string(),
  name: v.optional(v.string()),
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
});

// Additional functions needed by frontend
export const getAll = query({
  args: {},
  returns: v.array(waitlistDocValidator),
  handler: async (ctx) => {
    return await ctx.db.query("waitlist").collect();
  },
});

export const getById = query({
  args: {
    id: v.id("waitlist"),
  },
  returns: v.union(waitlistDocValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waitlist")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

export const getWaitlistCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const entries = await ctx.db.query("waitlist").collect();
    return entries.length;
  },
});

export const getWaitlistEntries = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()), // Pagination offset
    addedBy: v.optional(v.id("users")), // Filter by staff member who added the entry
  },
  returns: v.object({
    entries: v.array(v.object({
      _id: v.id("waitlist"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
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
    total: v.number(), // Total count of entries matching filters
  }),
  handler: async (ctx, args) => {
    let entries = await ctx.db.query("waitlist").collect();
    
    // Filter by staff member who added the entry (if provided)
    if (args.addedBy) {
      entries = entries.filter((entry: Doc<"waitlist">) => entry.addedBy === args.addedBy);
    }
    
    if (args.status && args.status !== 'all') {
      entries = entries.filter((entry: Doc<"waitlist">) => entry.status === args.status);
    }
    
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
    
    // Map entries to match the return type
    const mappedEntries = entries.map((entry: Doc<"waitlist">) => ({
      _id: entry._id,
      _creationTime: entry._creationTime,
      email: entry.email,
      name: entry.name,
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
    };
  },
});
