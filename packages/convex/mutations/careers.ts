// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Job Posting Management
export const createJobPosting = mutation({
  args: {
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.union(v.literal("full-time"), v.literal("part-time"), v.literal("contract"), v.literal("internship")),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    description: v.string(),
    requirements: v.array(v.string()),
    benefits: v.array(v.string()),
    applicationDeadline: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("closed"), v.literal("archived")),
  },
  handler: async (ctx: any, args: any) => {
    const jobId = await ctx.db.insert("jobPosting", {
      title: args.title,
      department: args.department,
      location: args.location,
      type: args.type,
      salaryMin: args.salaryMin,
      salaryMax: args.salaryMax,
      description: args.description,
      requirements: args.requirements,
      benefits: args.benefits,
      applicationDeadline: args.applicationDeadline,
      status: args.status,
      postedAt: args.status === 'published' ? Date.now() : undefined,
      createdBy: 'admin', // In a real app, this would be the current user
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Log the job creation
    await ctx.db.insert("adminActivity", {
      type: "job_posting_created",
      description: `Job posting "${args.title}" was created`,
      timestamp: Date.now(),
      metadata: {
        jobId,
        title: args.title,
        department: args.department,
        status: args.status,
      },
    });
    
    return { success: true, jobId };
  },
});

export const updateJobPosting = mutation({
  args: {
    jobId: v.id("jobPosting"),
    title: v.optional(v.string()),
    department: v.optional(v.string()),
    location: v.optional(v.string()),
    type: v.optional(v.union(v.literal("full-time"), v.literal("part-time"), v.literal("contract"), v.literal("internship"))),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    description: v.optional(v.string()),
    requirements: v.optional(v.array(v.string())),
    benefits: v.optional(v.array(v.string())),
    applicationDeadline: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("closed"), v.literal("archived"))),
  },
  handler: async (ctx: any, args: any) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job posting not found");
    }
    
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    if (args.title !== undefined) updateData.title = args.title;
    if (args.department !== undefined) updateData.department = args.department;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.salaryMin !== undefined) updateData.salaryMin = args.salaryMin;
    if (args.salaryMax !== undefined) updateData.salaryMax = args.salaryMax;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.requirements !== undefined) updateData.requirements = args.requirements;
    if (args.benefits !== undefined) updateData.benefits = args.benefits;
    if (args.applicationDeadline !== undefined) updateData.applicationDeadline = args.applicationDeadline;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === 'published' && job.status !== 'published') {
        updateData.postedAt = Date.now();
      }
    }
    
    await ctx.db.patch(args.jobId, updateData);
    
    // Log the job update
    await ctx.db.insert("adminActivity", {
      type: "job_posting_updated",
      description: `Job posting "${job.title}" was updated`,
      timestamp: Date.now(),
      metadata: {
        jobId: args.jobId,
        title: job.title,
        changes: updateData,
      },
    });
    
    return { success: true };
  },
});

export const deleteJobPosting = mutation({
  args: {
    jobId: v.id("jobPosting"),
  },
  handler: async (ctx: any, args: any) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job posting not found");
    }
    
    await ctx.db.delete(args.jobId);
    
    // Log the job deletion
    await ctx.db.insert("adminActivity", {
      type: "job_posting_deleted",
      description: `Job posting "${job.title}" was deleted`,
      timestamp: Date.now(),
      metadata: {
        jobId: args.jobId,
        title: job.title,
        department: job.department,
      },
    });
    
    return { success: true };
  },
});

// Job Application Management
export const createJobApplication = mutation({
  args: {
    jobId: v.id("jobPosting"),
    applicantName: v.string(),
    applicantEmail: v.string(),
    applicantPhone: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
    experience: v.string(),
    skills: v.array(v.string()),
    expectedSalary: v.optional(v.number()),
    availability: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      throw new Error("Job posting not found");
    }
    
    const applicationId = await ctx.db.insert("jobApplication", {
      jobId: args.jobId,
      jobTitle: job.title,
      applicantName: args.applicantName,
      applicantEmail: args.applicantEmail,
      applicantPhone: args.applicantPhone,
      status: "pending",
      appliedAt: Date.now(),
      resumeUrl: args.resumeUrl,
      coverLetter: args.coverLetter,
      experience: args.experience,
      skills: args.skills,
      expectedSalary: args.expectedSalary,
      availability: args.availability,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, applicationId };
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("jobApplication"),
    status: v.union(v.literal("pending"), v.literal("reviewing"), v.literal("interviewed"), v.literal("accepted"), v.literal("rejected")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      notes: args.notes,
      updatedAt: Date.now(),
    });
    
    // Log the status change
    await ctx.db.insert("adminActivity", {
      type: "application_status_changed",
      description: `Application from ${application.applicantName} status changed to ${args.status}`,
      timestamp: Date.now(),
      metadata: {
        applicationId: args.applicationId,
        applicantName: application.applicantName,
        jobTitle: application.jobTitle,
        oldStatus: application.status,
        newStatus: args.status,
        notes: args.notes,
      },
    });
    
    return { success: true };
  },
});

export const scheduleInterview = mutation({
  args: {
    applicationId: v.id("jobApplication"),
    interviewDate: v.number(),
    interviewNotes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    await ctx.db.patch(args.applicationId, {
      status: "interviewed",
      interviewDate: args.interviewDate,
      interviewNotes: args.interviewNotes,
      updatedAt: Date.now(),
    });
    
    // Log the interview scheduling
    await ctx.db.insert("adminActivity", {
      type: "interview_scheduled",
      description: `Interview scheduled for ${application.applicantName}`,
      timestamp: Date.now(),
      metadata: {
        applicationId: args.applicationId,
        applicantName: application.applicantName,
        jobTitle: application.jobTitle,
        interviewDate: args.interviewDate,
        interviewNotes: args.interviewNotes,
      },
    });
    
    return { success: true };
  },
});

export const addApplicationNotes = mutation({
  args: {
    applicationId: v.id("jobApplication"),
    notes: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    await ctx.db.patch(args.applicationId, {
      notes: args.notes,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Legacy functions for backward compatibility (if needed)
export const approveChef = mutation({
  args: {
    chefId: v.id("chefs"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // This function is no longer used but kept for compatibility
    return { success: true };
  },
});

export const suspendChef = mutation({
  args: {
    chefId: v.id("chefs"),
    reason: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // This function is no longer used but kept for compatibility
    return { success: true };
  },
});

export const updateChefRating = mutation({
  args: {
    chefId: v.id("chefs"),
    rating: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    // This function is no longer used but kept for compatibility
    return { success: true };
  },
});

export const respondToReview = mutation({
  args: {
    reviewId: v.id("chefReviews"),
    response: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // This function is no longer used but kept for compatibility
    return { success: true };
  },
});

// Additional functions needed by frontend
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("jobPosting"),
    status: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const deleteJob = mutation({
  args: {
    jobId: v.id("jobPosting"),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.jobId);
    return { success: true };
  },
});

export const deleteApplication = mutation({
  args: {
    applicationId: v.id("jobApplication"),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.applicationId);
    return { success: true };
  },
});

export const submitJobApplication = mutation({
  args: {
    jobId: v.id("jobPosting"),
    applicantName: v.string(),
    applicantEmail: v.string(),
    applicantPhone: v.optional(v.string()),
    coverLetter: v.optional(v.string()),
    resumeUrl: v.optional(v.string()),
    experience: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    availability: v.optional(v.string()),
    expectedSalary: v.optional(v.number()),
    references: v.optional(v.array(v.object({
      name: v.string(),
      position: v.string(),
      company: v.string(),
      email: v.string(),
      phone: v.string(),
    }))),
  },
  handler: async (ctx: any, args: any) => {
    const applicationId = await ctx.db.insert("jobApplication", {
      jobId: args.jobId,
      applicantName: args.applicantName,
      applicantEmail: args.applicantEmail,
      applicantPhone: args.applicantPhone,
      coverLetter: args.coverLetter,
      resumeUrl: args.resumeUrl,
      experience: args.experience,
      skills: args.skills || [],
      availability: args.availability,
      expectedSalary: args.expectedSalary,
      references: args.references || [],
      status: "pending",
      appliedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, applicationId };
  },
});