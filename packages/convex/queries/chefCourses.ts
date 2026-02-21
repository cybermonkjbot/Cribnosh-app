// @ts-nocheck
import { v } from 'convex/values';
import { internalQuery, query } from '../_generated/server';
import { isAdmin, isStaff, requireAuth } from '../utils/auth';

/**
 * Get all courses for a chef
 */
export const getByFoodCreatorId = query({
  args: {
    foodCreatorId: v.id("chefs"),
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
export const getByFoodCreatorAndCourse = query({
  args: {
    foodCreatorId: v.id("chefs"),
    courseId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get food creator to verify ownership
    const foodCreator = await ctx.db.get(args.foodCreatorId);

    if (!foodCreator) {
      throw new Error('Food Creator not found');
    }

    // Users can only access their own courses, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      throw new Error('Access denied');
    }

    const course = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q =>
        q.eq('chefId', args.foodCreatorId).eq('courseId', args.courseId)
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
    foodCreatorId: v.id("chefs"),
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
    foodCreatorId: v.id("chefs"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get food creator to verify ownership
    const foodCreator = await ctx.db.get(args.foodCreatorId);

    if (!foodCreator) {
      return false;
    }

    // Users can only check their own onboarding, staff/admin can check any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      return false;
    }

    // Check if compliance course is completed
    const complianceCourse = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q =>
        q.eq('chefId', args.foodCreatorId).eq('courseId', 'compliance-course-v1')
      )
      .first();

    // Onboarding is complete if compliance course exists and is completed
    return complianceCourse?.status === 'completed';
  },
});

/**
 * Check if chef can go online (compliance training + required documents verified)
 */
export const canGoOnline = query({
  args: {
    foodCreatorId: v.id("chefs"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get food creator to verify ownership
    const foodCreator = await ctx.db.get(args.foodCreatorId);

    if (!foodCreator) {
      return {
        canGoOnline: false,
        reasons: ['Food Creator not found'],
        complianceTrainingComplete: false,
        allDocumentsVerified: false,
      };
    }

    // Users can only check their own status, staff/admin can check any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      return {
        canGoOnline: false,
        reasons: ['Access denied'],
        complianceTrainingComplete: false,
        allDocumentsVerified: false,
      };
    }

    // Check if compliance course is completed
    const complianceCourse = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q =>
        q.eq('chefId', args.chefId).eq('courseId', 'compliance-course-v1')
      )
      .first();

    const complianceTrainingComplete = complianceCourse?.status === 'completed';

    // Check required documents
    const documents = await ctx.db
      .query('chefDocuments')
      .withIndex('by_chef', q => q.eq('chefId', args.foodCreatorId as any))
      .collect();

    const requiredDocuments = documents.filter(d => d.isRequired);
    const verifiedRequiredDocuments = requiredDocuments.filter(d => d.status === 'verified');
    const allDocumentsVerified = requiredDocuments.length > 0
      ? verifiedRequiredDocuments.length === requiredDocuments.length
      : true; // If no required documents, consider it verified

    const reasons: string[] = [];
    if (!complianceTrainingComplete) {
      reasons.push('Complete compliance training');
    }
    if (!allDocumentsVerified) {
      const missingCount = requiredDocuments.length - verifiedRequiredDocuments.length;
      reasons.push(`${missingCount} required document${missingCount !== 1 ? 's' : ''} need${missingCount === 1 ? 's' : ''} verification`);
    }

    return {
      canGoOnline: complianceTrainingComplete && allDocumentsVerified,
      reasons,
      complianceTrainingComplete,
      allDocumentsVerified,
      requiredDocumentsCount: requiredDocuments.length,
      verifiedRequiredDocumentsCount: verifiedRequiredDocuments.length,
    };
  },
});

/**
 * Internal query to get enrollment by chef and course without authentication
 * Used by actions during seeding and setup flows
 */
export const getEnrollmentByChefAndCourse = internalQuery({
  args: {
    chefId: v.id("chefs"),
    courseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q =>
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
  },
});

