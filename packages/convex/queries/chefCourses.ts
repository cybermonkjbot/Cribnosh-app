import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';

/**
 * Get all courses for a chef
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
    
    // Users can only access their own courses, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const courses = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId as any))
      .collect();
    
    return courses;
  },
});

/**
 * Get a specific course enrollment for a chef
 */
export const getByChefAndCourse = query({
  args: {
    chefId: v.id("chefs"),
    courseId: v.string(),
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
    
    // Users can only access their own courses, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const course = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
    
    return course;
  },
});

/**
 * Get course progress summary for a chef
 */
export const getProgressSummary = query({
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
    
    // Users can only access their own courses, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const courses = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId as any))
      .collect();
    
    let totalModules = 0;
    let completedModules = 0;
    let totalTimeSpent = 0;
    let completedCourses = 0;
    
    for (const course of courses) {
      totalModules += course.progress.length;
      completedModules += course.progress.filter(m => m.completed).length;
      totalTimeSpent += course.totalTimeSpent;
      if (course.status === 'completed') {
        completedCourses++;
      }
    }
    
    const progressPercentage = totalModules > 0 
      ? (completedModules / totalModules) * 100 
      : 0;
    
    return {
      totalCourses: courses.length,
      completedCourses,
      totalModules,
      completedModules,
      progressPercentage,
      totalTimeSpent,
      courses: courses.map(c => ({
        _id: c._id,
        courseId: c.courseId,
        courseName: c.courseName,
        status: c.status,
        progress: {
          total: c.progress.length,
          completed: c.progress.filter(m => m.completed).length,
        },
      })),
    };
  },
});

/**
 * Check if chef has completed onboarding (compliance course)
 */
export const isOnboardingComplete = query({
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
      return false;
    }
    
    // Users can only check their own onboarding, staff/admin can check any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      return false;
    }
    
    // Check if compliance course is completed
    const complianceCourse = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', 'compliance-course-v1')
      )
      .first();
    
    // Onboarding is complete if compliance course exists and is completed
    return complianceCourse?.status === 'completed';
  },
});

