// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';

export const getByChefId = query({
  args: { chef_id: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.query('documents').filter(q => q.eq(q.field('userEmail'), args.chef_id)).collect();
  },
});

export const getById = query({
  args: { documentId: v.id('documents') },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const getPresignedDownloadUrl = query({
  args: { document_id: v.id('documents') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    try {
      // Use Convex file storage system
      const document = await ctx.db.get(args.document_id);
      
      if (!document || !document.storageId) {
        console.log(`Document ${args.document_id} not found or has no storage ID`);
        return null;
      }
      
      // Generate a signed URL for the file using Convex storage
      const url = await ctx.storage.getUrl(document.storageId);
      
      if (!url) {
        console.log(`Failed to generate URL for storage ID ${document.storageId}`);
        return null;
      }
      
      console.log(`Generated Convex storage URL for document ${args.document_id}`);
      return url;
    } catch (error) {
      console.error('Failed to generate document URL:', error);
      return null;
    }
  },
}); 