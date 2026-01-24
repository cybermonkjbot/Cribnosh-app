import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";

// Job Postings
export const getJobPostings = query({
  args: {
    status: v.optional(v.string()),
    department: v.optional(v.string()),
    type: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let jobs = await ctx.db.query("jobPosting").collect();

    if (args.status) {
      jobs = jobs.filter((job: Doc<"jobPosting">) => job.status === args.status);
    }

    if (args.department) {
      jobs = jobs.filter((job: Doc<"jobPosting">) => job.department === args.department);
    }

    if (args.type) {
      jobs = jobs.filter((job: Doc<"jobPosting">) => job.type === args.type);
    }

    // Get applicant counts for all jobs
    const jobsWithApplicantCounts = await Promise.all(
      jobs.map(async (job: Doc<"jobPosting">) => {
        const applicantCount = await ctx.db
          .query("jobApplication")
          .withIndex("by_job", (q: any) => q.eq("jobId", job._id))
          .count();

        return {
          _id: job._id,
          title: job.title,
          department: job.department,
          location: job.location,
          type: job.type as 'full-time' | 'part-time' | 'contract' | 'internship',
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          status: job.status as 'draft' | 'published' | 'closed' | 'archived',
          description: job.description,
          requirements: job.requirements || [],
          benefits: job.benefits || [],
          postedAt: job.postedAt || job._creationTime,
          applicationDeadline: job.applicationDeadline,
          applicantCount,
          createdBy: job.createdBy || 'admin',
          updatedAt: job.updatedAt || job._creationTime
        };
      })
    );

    return jobsWithApplicantCounts;
  },
});


// Job Applications
export const getJobApplications = query({
  args: {
    status: v.optional(v.string()),
    jobId: v.optional(v.id("jobPosting")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let applicationQuery = ctx.db.query("jobApplication");

    if (args.jobId) {
      applicationQuery = applicationQuery.withIndex("by_job", (q: any) => q.eq("jobId", args.jobId));
    }

    // Safety limit
    const applications = await applicationQuery.order("desc").take(200);

    return applications.map((app: Doc<"jobApplication">) => ({
      _id: app._id,
      jobId: app.jobId,
      jobTitle: app.jobTitle || 'Unknown Position',
      applicantName: app.fullName,
      applicantEmail: app.email,
      applicantPhone: app.phone,
      status: app.status as 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected',
      appliedAt: app.submittedAt || app._creationTime,
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      experience: app.experience || '',
      skills: app.skills || [],
      expectedSalary: app.expectedSalary,
      availability: app.availability || 'Immediate',
      notes: app.notes,
      rating: app.rating,
      interviewDate: app.interviewDate,
      interviewNotes: app.interviewNotes
    }));
  },
});

export const getApplicationStats = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any) => {
    const [total, pending, reviewing, interviewed, accepted, rejected] = await Promise.all([
      (ctx.db.query("jobApplication") as any).count(),
      (ctx.db.query("jobApplication").filter((q: any) => q.eq(q.field("status"), 'pending')) as any).count(),
      (ctx.db.query("jobApplication").filter((q: any) => q.eq(q.field("status"), 'reviewing')) as any).count(),
      (ctx.db.query("jobApplication").filter((q: any) => q.eq(q.field("status"), 'interviewed')) as any).count(),
      (ctx.db.query("jobApplication").filter((q: any) => q.eq(q.field("status"), 'accepted')) as any).count(),
      (ctx.db.query("jobApplication").filter((q: any) => q.eq(q.field("status"), 'rejected')) as any).count(),
    ]);

    return {
      total,
      pending,
      reviewing,
      interviewed,
      accepted,
      rejected,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0
    };
  },
});

// Legacy functions for backward compatibility (if needed)
export const getNewChefApplicationsCount = query({
  args: {},
  handler: async (ctx: any) => {
    // Return 0 since we're not using chef applications anymore
    return 0;
  },
});

export const getApprovedChefs = query({
  args: {},
  handler: async (ctx: any) => {
    // Return empty array since we're not using chef management anymore
    return [];
  },
});

export const getChefReviews = query({
  args: {},
  handler: async (ctx: any) => {
    // Return empty array since we're not using chef reviews anymore
    return [];
  },
});

export const getJobBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const job = await ctx.db
      .query("jobPosting")
      .filter((q: any) => q.eq(q.field("slug"), args.slug))
      .first();

    if (!job) {
      return null;
    }

    return {
      ...job,
      applications: await ctx.db
        .query("jobApplication")
        .filter((q: any) => q.eq(q.field("jobId"), job._id))
        .collect(),
    };
  },
});

export const listActiveJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const limit = args.limit || 20;

    const jobs = await ctx.db
      .query("jobPosting")
      .filter((q: any) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit);

    return jobs;
  },
});

export const getJobStats = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any) => {
    const jobs = await ctx.db.query("jobPosting").collect();
    const applications = await ctx.db.query("jobApplication").collect();

    const totalJobs = jobs.length;
    const publishedJobs = jobs.filter((job: Doc<"jobPosting">) => job.status === 'published').length;
    const draftJobs = jobs.filter((job: Doc<"jobPosting">) => job.status === 'draft').length;
    const archivedJobs = jobs.filter((job: Doc<"jobPosting">) => job.status === 'archived').length;

    const totalApplications = applications.length;
    const pendingApplications = applications.filter((app: Doc<"jobApplication">) => app.status === 'pending').length;
    const reviewingApplications = applications.filter((app: Doc<"jobApplication">) => app.status === 'reviewing').length;
    const interviewedApplications = applications.filter((app: Doc<"jobApplication">) => app.status === 'interviewed').length;
    const acceptedApplications = applications.filter((app: Doc<"jobApplication">) => app.status === 'accepted').length;
    const rejectedApplications = applications.filter((app: Doc<"jobApplication">) => app.status === 'rejected').length;

    return {
      totalJobs,
      publishedJobs,
      draftJobs,
      archivedJobs,
      totalApplications,
      pendingApplications,
      reviewingApplications,
      interviewedApplications,
      acceptedApplications,
      rejectedApplications,
      averageApplicationsPerJob: totalJobs > 0 ? totalApplications / totalJobs : 0,
      acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0,
    };
  },
});