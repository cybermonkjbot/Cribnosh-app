// @ts-nocheck
import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';
import { Id } from '../_generated/dataModel';

/**
 * Upload a document for a chef
 */
export const uploadDocument = mutation({
  args: {
    chefId: v.id("chefs"),
    documentType: v.union(
      v.literal("id"),
      v.literal("health_permit"),
      v.literal("insurance"),
      v.literal("tax"),
      v.literal("kitchen_cert"),
      v.literal("fba"),
      v.literal("other")
    ),
    documentName: v.string(),
    fileName: v.string(),
    fileStorageId: v.id("_storage"),
    fileUrl: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    isRequired: v.boolean(),
    metadata: v.optional(v.object({
      documentNumber: v.optional(v.string()),
      issueDate: v.optional(v.number()),
      expiryDate: v.optional(v.number()),
      issuingAuthority: v.optional(v.string()),
      additionalInfo: v.optional(v.any()),
    })),
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
    
    // Users can only upload their own documents, staff/admin can upload for any chef
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const now = Date.now();
    
    // Create document record
    const documentId = await ctx.db.insert('chefDocuments', {
      chefId: args.chefId,
      documentType: args.documentType,
      documentName: args.documentName,
      fileName: args.fileName,
      fileStorageId: args.fileStorageId,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      uploadedAt: now,
      status: 'pending',
      isRequired: args.isRequired,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
    
    return documentId;
  },
});

/**
 * Update document status (for admin/staff verification)
 */
export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id("chefDocuments"),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    rejectionReason: v.optional(v.string()),
    rejectionDetails: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require staff/admin authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error('Access denied: Staff or admin required');
    }
    
    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    const now = Date.now();
    const updateData: any = {
      status: args.status,
      updatedAt: now,
    };
    
    if (args.status === 'verified') {
      updateData.verifiedAt = now;
      updateData.verifiedBy = user._id;
      updateData.rejectionReason = undefined;
      updateData.rejectionDetails = undefined;
    } else if (args.status === 'rejected') {
      updateData.rejectionReason = args.rejectionReason;
      updateData.rejectionDetails = args.rejectionDetails;
    }
    
    await ctx.db.patch(args.documentId, updateData);
    
    return args.documentId;
  },
});

/**
 * Delete a document
 */
export const deleteDocument = mutation({
  args: {
    documentId: v.id("chefDocuments"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get document
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(document.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only delete their own documents, staff/admin can delete any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Delete document
    await ctx.db.delete(args.documentId);
    
    return args.documentId;
  },
});

