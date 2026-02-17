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
