import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Upload an email asset (image) to Convex storage
 */
export const uploadEmailAsset = mutation({
  args: {
    url: v.string(), // Original URL or identifier
    storageId: v.id("_storage"),
    contentType: v.string(),
    purpose: v.string(), // e.g., 'welcome-email', 'logo', 'social-icon'
    alt: v.optional(v.string()),
    metadata: v.optional(v.object({
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      size: v.optional(v.number()),
    })),
  },
  returns: v.id("emailAssets"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailAssets")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();

    if (existing) {
      // Update existing asset
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        contentType: args.contentType,
        purpose: args.purpose,
        alt: args.alt,
        metadata: args.metadata,
        lastUsed: Date.now(),
      });
      return existing._id;
    }

    // Create new asset
    const assetId = await ctx.db.insert("emailAssets", {
      url: args.url,
      storageId: args.storageId,
      contentType: args.contentType,
      purpose: args.purpose,
      alt: args.alt,
      metadata: args.metadata,
      lastUsed: Date.now(),
    });

    return assetId;
  },
});

/**
 * Get email asset by URL
 */
export const getEmailAssetByUrl = mutation({
  args: { url: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("emailAssets"),
      url: v.string(),
      storageId: v.id("_storage"),
      contentType: v.string(),
      purpose: v.string(),
      alt: v.optional(v.string()),
      metadata: v.optional(v.object({
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        size: v.optional(v.number()),
      })),
      lastUsed: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const asset = await ctx.db
      .query("emailAssets")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    
    return asset;
  },
});

/**
 * Update last used timestamp for an asset
 */
export const touchEmailAsset = mutation({
  args: { assetId: v.id("emailAssets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assetId, {
      lastUsed: Date.now(),
    });
    return null;
  },
});

