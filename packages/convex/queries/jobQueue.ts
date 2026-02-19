// @ts-nocheck
import { query } from '../_generated/server';

/**
 * Get all jobs in the queue (for admin)
 */
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query('jobQueue').collect();
    },
});
/**
 * Get the count of pending jobs in the queue.
 */
export const getPendingCount = query({
    args: {},
    handler: async (ctx) => {
        const pendingJobs = await ctx.db
            .query("jobQueue")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
        return pendingJobs.length;
    },
});
