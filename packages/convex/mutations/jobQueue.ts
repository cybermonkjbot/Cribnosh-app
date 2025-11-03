import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory 
} from '../../../apps/web/lib/errors/convex-exports';

// Enqueue a new job
export const enqueueJob = mutation({
  args: {
    jobType: v.string(),
    payload: v.any(),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('normal'),
      v.literal('high'),
      v.literal('urgent')
    )),
    maxAttempts: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, { jobType, payload, priority = 'normal', maxAttempts = 3 }) => {
    const jobId = await ctx.db.insert("jobQueue", {
      jobType,
      payload,
      status: 'pending',
      priority,
      attempts: 0,
      maxAttempts,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return jobId;
  },
});

// Get next job to process
export const getNextJob = mutation({
  args: {
    processorId: v.string(),
    jobTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx: MutationCtx, { processorId, jobTypes }) => {
    const now = Date.now();
    
    // Find a pending job
    const pendingJobs = await ctx.db
      .query("jobQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => {
        if (jobTypes && jobTypes.length > 0) {
          return q.or(...jobTypes.map(type => q.eq(q.field("jobType"), type)));
        }
        return q.eq(q.field("_id"), q.field("_id")); // Always true condition
      })
      .order("desc")
      .collect();

    // Sort by priority and creation time
    const sortedJobs = pendingJobs.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.createdAt - b.createdAt;
    });

    if (sortedJobs.length === 0) {
      return null;
    }

    const job = sortedJobs[0];
    
    // Try to acquire lock
    const lockId = await ctx.db.insert("jobLocks", {
      jobId: job._id,
      processorId,
      lockedAt: now,
      expiresAt: now + (5 * 60 * 1000), // 5 minute lock
    });

    // Update job status
    await ctx.db.patch(job._id, {
      status: 'processing',
      startedAt: now,
      updatedAt: now,
    });

    return {
      jobId: job._id,
      lockId,
      jobType: job.jobType,
      payload: job.payload,
      attempts: job.attempts,
    };
  },
});

// Mark job as completed
export const completeJob = mutation({
  args: {
    jobId: v.id("jobQueue"),
    lockId: v.id("jobLocks"),
    result: v.optional(v.any()),
  },
  handler: async (ctx: MutationCtx, { jobId, lockId, result }) => {
    // Verify lock is still valid
    const lock = await ctx.db.get(lockId);
    if (!lock || lock.jobId !== jobId) {
      throw new Error("Invalid or expired lock");
    }

    // Update job
    await ctx.db.patch(jobId, {
      status: 'completed',
      completedAt: Date.now(),
      result,
      updatedAt: Date.now(),
    });

    // Remove lock
    await ctx.db.delete(lockId);

    return { success: true };
  },
});

// Mark job as failed
export const failJob = mutation({
  args: {
    jobId: v.id("jobQueue"),
    lockId: v.id("jobLocks"),
    error: v.string(),
  },
  handler: async (ctx: MutationCtx, { jobId, lockId, error }) => {
    // Verify lock is still valid
    const lock = await ctx.db.get(lockId);
    if (!lock || lock.jobId !== jobId) {
      throw new Error("Invalid or expired lock");
    }

    const job = await ctx.db.get(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    const newAttempts = job.attempts + 1;
    const shouldRetry = newAttempts < job.maxAttempts;

    // Update job
    await ctx.db.patch(jobId, {
      status: shouldRetry ? 'retry' : 'failed',
      attempts: newAttempts,
      error,
      nextAttemptAt: shouldRetry ? Date.now() + (Math.pow(2, newAttempts) * 1000) : undefined,
      updatedAt: Date.now(),
    });

    // Remove lock
    await ctx.db.delete(lockId);

    return { success: true, willRetry: shouldRetry };
  },
});

// Retry failed jobs
export const retryFailedJobs = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    
    const retryJobs = await ctx.db
      .query("jobQueue")
      .withIndex("by_status", (q) => q.eq("status", "retry"))
      .filter((q) => q.lte(q.field("nextAttemptAt"), now))
      .collect();

    let retried = 0;
    for (const job of retryJobs) {
      await ctx.db.patch(job._id, {
        status: 'pending',
        updatedAt: now,
      });
      retried++;
    }

    return { retried };
  },
});

// Clean up old completed/failed jobs
export const cleanupOldJobs = mutation({
  args: {
    olderThanMs: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, { olderThanMs = 7 * 24 * 60 * 60 * 1000 }) => {
    const cutoffTime = Date.now() - olderThanMs;
    
    const oldJobs = await ctx.db
      .query("jobQueue")
      .filter((q) => 
        q.and(
          q.or(
            q.eq(q.field("status"), "completed"),
            q.eq(q.field("status"), "failed")
          ),
          q.lt(q.field("createdAt"), cutoffTime)
        )
      )
      .collect();

    let deleted = 0;
    for (const job of oldJobs) {
      await ctx.db.delete(job._id);
      deleted++;
    }

    return { deleted };
  },
}); 