import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';
import { Id } from '../_generated/dataModel';

/**
 * Enroll a chef in a course
 */
export const enrollInCourse = mutation({
  args: {
    chefId: v.id("chefs"),
    courseId: v.string(),
    courseName: v.string(),
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
    
    // Users can only enroll themselves, staff/admin can enroll any chef
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Check if already enrolled
    const existing = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
    
    if (existing) {
      throw new Error('Already enrolled in this course');
    }
    
    // Get all published modules for this course to initialize progress
    const courseModules = await ctx.db
      .query('courseModules')
      .withIndex('by_course', q => q.eq('courseId', args.courseId))
      .filter(q => q.eq(q.field('status'), 'published'))
      .collect();
    
    // Sort by module number
    courseModules.sort((a, b) => a.moduleNumber - b.moduleNumber);
    
    // Initialize progress array with all modules
    const initialProgress = courseModules.map(module => ({
      moduleId: module.moduleId,
      moduleName: module.moduleName,
      moduleNumber: module.moduleNumber,
      completed: false,
      quizAttempts: 0,
      lastAccessed: 0,
      timeSpent: 0,
    }));
    
    const now = Date.now();
    const enrollmentId = await ctx.db.insert('chefCourses', {
      chefId: args.chefId,
      courseId: args.courseId,
      courseName: args.courseName,
      enrollmentDate: now,
      status: initialProgress.length > 0 ? 'enrolled' : 'enrolled',
      progress: initialProgress,
      totalTimeSpent: 0,
      lastAccessed: now,
      createdAt: now,
      updatedAt: now,
    });
    
    return enrollmentId;
  },
});

/**
 * Sync course modules (initialize missing modules in enrollment)
 */
export const syncCourseModules = mutation({
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
    
    // Users can only sync their own courses, staff/admin can sync any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Get enrollment
    const enrollment = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
    
    if (!enrollment) {
      throw new Error('Not enrolled in this course');
    }
    
    // Get all published modules for this course
    const courseModules = await ctx.db
      .query('courseModules')
      .withIndex('by_course', q => q.eq('courseId', args.courseId))
      .filter(q => q.eq(q.field('status'), 'published'))
      .collect();
    
    // Sort by module number
    courseModules.sort((a, b) => a.moduleNumber - b.moduleNumber);
    
    // Get existing module IDs
    const existingModuleIds = new Set(enrollment.progress.map(m => m.moduleId));
    
    // Add missing modules
    const updatedProgress = [...enrollment.progress];
    let hasChanges = false;
    
    courseModules.forEach(module => {
      if (!existingModuleIds.has(module.moduleId)) {
        updatedProgress.push({
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          moduleNumber: module.moduleNumber,
          completed: false,
          quizAttempts: 0,
          lastAccessed: 0,
          timeSpent: 0,
        });
        hasChanges = true;
      }
    });
    
    // Sort by module number
    updatedProgress.sort((a, b) => a.moduleNumber - b.moduleNumber);
    
    // Update enrollment if there were changes
    if (hasChanges) {
      await ctx.db.patch(enrollment._id, {
        progress: updatedProgress,
        updatedAt: Date.now(),
      });
    }
    
    return enrollment._id;
  },
});

/**
 * Update module progress
 */
export const updateModuleProgress = mutation({
  args: {
    chefId: v.id("chefs"),
    courseId: v.string(),
    moduleId: v.string(),
    moduleName: v.string(),
    moduleNumber: v.number(),
    completed: v.boolean(),
    timeSpent: v.optional(v.number()), // in seconds
    quizScore: v.optional(v.number()),
    quizAnswers: v.optional(v.array(v.object({
      questionId: v.string(),
      answer: v.any(),
      isCorrect: v.boolean(),
      attemptNumber: v.number(),
      answeredAt: v.number(),
    }))),
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
    
    // Users can only update their own progress, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Get course enrollment
    const enrollment = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
    
    if (!enrollment) {
      throw new Error('Not enrolled in this course');
    }
    
    const now = Date.now();
    const timeSpent = args.timeSpent || 0;
    
    // Update or add module progress
    const existingModuleIndex = enrollment.progress.findIndex(
      m => m.moduleId === args.moduleId
    );
    
    let updatedProgress = [...enrollment.progress];
    
    if (existingModuleIndex >= 0) {
      // Update existing module
      const existingModule = enrollment.progress[existingModuleIndex];
      updatedProgress[existingModuleIndex] = {
        ...existingModule,
        moduleName: args.moduleName,
        moduleNumber: args.moduleNumber,
        completed: args.completed,
        completedAt: args.completed ? (existingModule.completedAt || now) : existingModule.completedAt,
        quizScore: args.quizScore !== undefined ? args.quizScore : existingModule.quizScore,
        quizAttempts: args.quizScore !== undefined 
          ? existingModule.quizAttempts + 1 
          : existingModule.quizAttempts,
        lastAccessed: now,
        timeSpent: existingModule.timeSpent + timeSpent,
        quizAnswers: args.quizAnswers || existingModule.quizAnswers,
      };
    } else {
      // Add new module
      updatedProgress.push({
        moduleId: args.moduleId,
        moduleName: args.moduleName,
        moduleNumber: args.moduleNumber,
        completed: args.completed,
        completedAt: args.completed ? now : undefined,
        quizScore: args.quizScore,
        quizAttempts: args.quizScore !== undefined ? 1 : 0,
        lastAccessed: now,
        timeSpent: timeSpent,
        quizAnswers: args.quizAnswers,
      });
    }
    
    // Check if all modules are completed
    const allModulesCompleted = updatedProgress.every(m => m.completed);
    const newStatus = allModulesCompleted ? 'completed' : 'in_progress';
    const wasJustCompleted = allModulesCompleted && enrollment.status !== 'completed';
    
    // Update enrollment
    await ctx.db.patch(enrollment._id, {
      status: newStatus,
      progress: updatedProgress,
      totalTimeSpent: enrollment.totalTimeSpent + timeSpent,
      lastAccessed: now,
      updatedAt: now,
      completionDate: allModulesCompleted && !enrollment.completionDate ? now : enrollment.completionDate,
    });
    
    // Generate certificate if course was just completed
    if (wasJustCompleted && !enrollment.certificateId) {
      try {
        // Generate certificate number
        const timestamp = Date.now();
        const certificateNumber = `CERT-${args.courseId.toUpperCase()}-${args.chefId.slice(-8)}-${timestamp}`;
        
        // Get user for chef name
        const chefUser = await ctx.db.get(chef.userId);
        const chefName = chefUser?.name || chef.name || 'Chef';
        
        // Create certificate record
        const certificateId = await ctx.db.insert('certificates', {
          chefId: args.chefId,
          courseId: args.courseId,
          courseName: enrollment.courseName,
          certificateNumber,
          issuedAt: now,
          chefName,
          status: 'active',
          createdAt: now,
        });
        
        // Update enrollment with certificate ID
        await ctx.db.patch(enrollment._id, {
          certificateId,
        });
      } catch (error) {
        // Log error but don't fail the progress update
        console.error('Error generating certificate:', error);
      }
    }
    
    return enrollment._id;
  },
});

/**
 * Mark course as accessed (update lastAccessed timestamp)
 */
export const markCourseAccessed = mutation({
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
    
    // Users can only update their own courses, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Get course enrollment
    const enrollment = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
    
    if (!enrollment) {
      throw new Error('Not enrolled in this course');
    }
    
    // Update lastAccessed
    await ctx.db.patch(enrollment._id, {
      lastAccessed: Date.now(),
      updatedAt: Date.now(),
    });
    
    return enrollment._id;
  },
});
