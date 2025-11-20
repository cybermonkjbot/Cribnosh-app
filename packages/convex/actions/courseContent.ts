"use node";

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { api } from '../_generated/api';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';

/**
 * Upload video to course module
 * This action handles file upload to Convex storage and updates the module
 */
export const uploadModuleVideo = action({
  args: {
    courseId: v.string(),
    moduleId: v.string(),
    videoStorageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    order: v.number(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin/staff authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error('Access denied: Admin or staff required');
    }
    
    // Get module
    const module = await ctx.runQuery(api.queries.courseModules.getModuleContent, {
      courseId: args.courseId,
      moduleId: args.moduleId,
      sessionToken: args.sessionToken,
    });
    
    if (!module) {
      throw new Error('Module not found');
    }
    
    // Get video URL from storage
    const videoUrl = await ctx.storage.getUrl(args.videoStorageId);
    
    if (!videoUrl) {
      throw new Error('Failed to get video URL from storage');
    }
    
    // Get current module data
    const moduleData = await ctx.runQuery(api.queries.courseModules.getModuleContent, {
      courseId: args.courseId,
      moduleId: args.moduleId,
      sessionToken: args.sessionToken,
    });
    
    if (!moduleData) {
      throw new Error('Module not found');
    }
    
    // Add video to module's videos array
    const existingVideos = moduleData.videos || [];
    const newVideo = {
      id: `${args.moduleId}-video-${Date.now()}`,
      videoUrl,
      videoStorageId: args.videoStorageId,
      title: args.title,
      description: args.description,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      order: args.order,
    };
    
    const updatedVideos = [...existingVideos, newVideo].sort((a, b) => a.order - b.order);
    
    // Update module with new video
    // Note: We need to get the full module data first to update it
    // This is a simplified version - in production, you'd fetch the full module record
    await ctx.runMutation(api.mutations.upsertModule, {
      courseId: args.courseId,
      moduleId: args.moduleId,
      moduleName: moduleData.moduleName,
      moduleNumber: moduleData.moduleNumber,
      description: moduleData.description,
      estimatedTime: moduleData.estimatedTime,
      content: moduleData.content || [],
      videos: updatedVideos,
      quiz: moduleData.quiz,
      prerequisites: moduleData.prerequisites,
      status: moduleData.status,
      sessionToken: args.sessionToken,
    });
    
    return {
      success: true,
      videoId: newVideo.id,
      videoUrl,
    };
  },
});

/**
 * Generate upload URL for course module video
 */
export const generateVideoUploadUrl = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin/staff authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error('Access denied: Admin or staff required');
    }
    
    // Generate upload URL
    const uploadUrl = await ctx.storage.generateUploadUrl();
    
    return uploadUrl;
  },
});

