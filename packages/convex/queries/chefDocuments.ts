import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';

/**
 * Get all documents for a chef
 */
export const getByChefId = query({
  args: {
    chefId: v.id("chefs"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only access their own documents, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const documents = await ctx.db
      .query('chefDocuments')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId as any))
      .collect();
    
    // Enrich documents with file URLs
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        try {
          const fileUrl = await ctx.storage.getUrl(doc.fileStorageId);
          return {
            ...doc,
            fileUrl: fileUrl || doc.fileUrl,
          };
        } catch (error) {
          console.error(`Error getting URL for document ${doc._id}:`, error);
          return doc;
        }
      })
    );
    
    return enrichedDocuments;
  },
});

/**
 * Get documents by type for a chef
 */
export const getByChefAndType = query({
  args: {
    chefId: v.id("chefs"),
    documentType: v.union(
      v.literal("id"),
      v.literal("health_permit"),
      v.literal("insurance"),
      v.literal("tax"),
      v.literal("kitchen_cert"),
      v.literal("other")
    ),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only access their own documents, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const documents = await ctx.db
      .query('chefDocuments')
      .withIndex('by_chef_type', q => 
        q.eq('chefId', args.chefId).eq('documentType', args.documentType)
      )
      .collect();
    
    // Enrich documents with file URLs
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        try {
          const fileUrl = await ctx.storage.getUrl(doc.fileStorageId);
          return {
            ...doc,
            fileUrl: fileUrl || doc.fileUrl,
          };
        } catch (error) {
          console.error(`Error getting URL for document ${doc._id}:`, error);
          return doc;
        }
      })
    );

    return enrichedDocuments;
  },
});

/**
 * Get documents summary for a chef
 */
export const getSummary = query({
  args: {
    chefId: v.id("chefs"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only access their own documents, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const documents = await ctx.db
      .query('chefDocuments')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId as any))
      .collect();
    
    // Enrich documents with file URLs
    const enrichedDocuments = await Promise.all(
      documents.map(async (doc) => {
        try {
          const fileUrl = await ctx.storage.getUrl(doc.fileStorageId);
          return {
            ...doc,
            fileUrl: fileUrl || doc.fileUrl,
          };
        } catch (error) {
          console.error(`Error getting URL for document ${doc._id}:`, error);
          return doc;
        }
      })
    );
    
    const required = enrichedDocuments.filter(d => d.isRequired);
    const verified = enrichedDocuments.filter(d => d.status === 'verified');
    const pending = enrichedDocuments.filter(d => d.status === 'pending');
    const rejected = enrichedDocuments.filter(d => d.status === 'rejected');
    const requiredVerified = required.filter(d => d.status === 'verified');
    
    return {
      total: enrichedDocuments.length,
      required: required.length,
      requiredVerified: requiredVerified.length,
      verified: verified.length,
      pending: pending.length,
      rejected: rejected.length,
      allRequiredVerified: required.length > 0 && requiredVerified.length === required.length,
      documents: enrichedDocuments.map(d => ({
        _id: d._id,
        documentType: d.documentType,
        documentName: d.documentName,
        status: d.status,
        isRequired: d.isRequired,
        uploadedAt: d.uploadedAt,
        verifiedAt: d.verifiedAt,
        fileUrl: d.fileUrl,
      })),
    };
  },
});

