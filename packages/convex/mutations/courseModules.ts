import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth, requireAdmin, requireStaff, isAdmin, isStaff } from '../utils/auth';
import { Id } from '../_generated/dataModel';

/**
 * Create or update a course module (admin/staff only)
 */
export const upsertModule = mutation({
  args: {
    courseId: v.string(),
    moduleId: v.string(),
    moduleName: v.string(),
    moduleNumber: v.number(),
    description: v.optional(v.string()),
    estimatedTime: v.number(),
    content: v.array(v.object({
      type: v.union(v.literal("text"), v.literal("video"), v.literal("image"), v.literal("interactive")),
      title: v.string(),
      order: v.number(),
      data: v.any(),
    })),
    videos: v.optional(v.array(v.object({
      id: v.string(),
      videoUrl: v.string(),
      videoStorageId: v.optional(v.id("_storage")),
      title: v.string(),
      description: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      duration: v.optional(v.number()),
      order: v.number(),
    }))),
    quiz: v.optional(v.object({
      questions: v.array(v.object({
        questionId: v.string(),
        question: v.string(),
        type: v.union(v.literal("multiple_choice"), v.literal("true_false"), v.literal("text")),
        options: v.optional(v.array(v.string())),
        correctAnswer: v.any(),
        explanation: v.optional(v.string()),
        order: v.number(),
      })),
      passingScore: v.number(),
      timeLimit: v.optional(v.number()),
    })),
    prerequisites: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin/staff authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error('Access denied: Admin or staff required');
    }
    
    const now = Date.now();
    
    // Check if module already exists
    const existing = await ctx.db
      .query('courseModules')
      .withIndex('by_course_module', q => 
        q.eq('courseId', args.courseId).eq('moduleId', args.moduleId)
      )
      .first();
    
    if (existing) {
      // Update existing module
      await ctx.db.patch(existing._id, {
        moduleName: args.moduleName,
        moduleNumber: args.moduleNumber,
        description: args.description,
        estimatedTime: args.estimatedTime,
        content: args.content,
        videos: args.videos,
        quiz: args.quiz,
        prerequisites: args.prerequisites,
        status: args.status,
        updatedAt: now,
      });
      
      return existing._id;
    } else {
      // Create new module
      const moduleId = await ctx.db.insert('courseModules', {
        courseId: args.courseId,
        moduleId: args.moduleId,
        moduleName: args.moduleName,
        moduleNumber: args.moduleNumber,
        description: args.description,
        estimatedTime: args.estimatedTime,
        content: args.content,
        videos: args.videos,
        quiz: args.quiz,
        prerequisites: args.prerequisites,
        status: args.status,
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
      });
      
      return moduleId;
    }
  },
});

/**
 * Delete a course module (admin/staff only)
 */
export const deleteModule = mutation({
  args: {
    courseId: v.string(),
    moduleId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin/staff authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error('Access denied: Admin or staff required');
    }
    
    // Find and delete module
    const module = await ctx.db
      .query('courseModules')
      .withIndex('by_course_module', q => 
        q.eq('courseId', args.courseId).eq('moduleId', args.moduleId)
      )
      .first();
    
    if (!module) {
      throw new Error('Module not found');
    }
    
    await ctx.db.delete(module._id);
    
    return module._id;
  },
});

