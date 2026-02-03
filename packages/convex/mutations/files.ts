// @ts-nocheck
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { mutation } from '../_generated/server';

// Upload file to storage
export const uploadFile = mutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert('documents', {
      userEmail: '', // Will be set by the calling function
      name: args.fileName,
      type: args.fileType,
      status: 'uploaded',
      uploadDate: new Date().toISOString(),
      size: args.fileSize.toString(),
      description: `Uploaded file: ${args.fileName}`,
      storageId: args.fileUrl as Id<'_storage'>,
    });

    return fileId;
  },
});

// Update file metadata
export const updateFileMetadata = mutation({
  args: {
    fileId: v.id('documents'),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      description: JSON.stringify(args.metadata),
    });
  },
});

// Delete file
export const deleteFile = mutation({
  args: {
    fileId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.fileId);
  },
});

// Generate upload URL for storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});