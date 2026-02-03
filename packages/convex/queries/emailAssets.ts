// @ts-nocheck
import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get email asset by URL
 */
export const getByUrl = query({
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
      _creationTime: v.number(),
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
 * Get all email assets for a specific purpose
 */
export const getByPurpose = query({
  args: { purpose: v.string() },
  returns: v.array(v.object({
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
    _creationTime: v.number(),
  })),
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("emailAssets")
      .withIndex("by_purpose", (q) => q.eq("purpose", args.purpose))
      .collect();
    
    return assets;
  },
});

/**
 * Get the public URL for an email asset
 */
export const getEmailAssetUrl = query({
  args: { assetId: v.id("emailAssets") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      return null;
    }

    const storageUrl = await ctx.storage.getUrl(asset.storageId);
    return storageUrl;
  },
});

