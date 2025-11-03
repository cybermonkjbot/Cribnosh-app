import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Generate upload URL for document
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    console.log('Generated upload URL for document');
    return uploadUrl;
  },
});

// Upload a new document
export const uploadDocument = mutation({
  args: {
    userEmail: v.string(),
    name: v.string(),
    type: v.string(),
    description: v.string(),
    size: v.string(),
    storageId: v.id('_storage'),
  },
  returns: v.id('documents'),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const documentId = await ctx.db.insert('documents', {
      userEmail: args.userEmail,
      name: args.name,
      type: args.type,
      status: 'uploaded',
      uploadDate: new Date().toISOString(),
      size: args.size,
      description: args.description,
      storageId: args.storageId,
    });
    
    console.log(`Uploaded document ${documentId} for user ${args.userEmail}`);
    return documentId;
  },
});

// Update document status
export const updateDocumentStatus = mutation({
  args: {
    documentId: v.id('documents'),
    status: v.union(
      v.literal('uploaded'),
      v.literal('pending_review'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('active'),
      v.literal('inactive'),
      v.literal('deleted')
    ),
    updatedAt: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    const updateData: any = {
      status: args.status,
    };
    
    if (args.updatedAt) {
      updateData.uploadDate = args.updatedAt;
    }
    
    await ctx.db.patch(args.documentId, updateData);
    
    console.log(`Updated document ${args.documentId} status to ${args.status}`);
    return await ctx.db.get(args.documentId);
  },
});

// Delete a document
export const deleteDocument = mutation({
  args: {
    documentId: v.id('documents'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Delete the file from storage
    await ctx.storage.delete(document.storageId);
    
    // Delete the document record
    await ctx.db.delete(args.documentId);
    
    console.log(`Deleted document ${args.documentId}`);
    return null;
  },
});

// Set document expiry date
export const setDocumentExpiry = mutation({
  args: {
    documentId: v.id('documents'),
    expiryDate: v.string(), // ISO date string
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    await ctx.db.patch(args.documentId, {
      expiryDate: args.expiryDate,
    });
    
    console.log(`Set expiry date for document ${args.documentId} to ${args.expiryDate}`);
    return await ctx.db.get(args.documentId);
  },
}); 