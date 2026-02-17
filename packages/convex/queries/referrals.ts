// @ts-nocheck
import { query } from '../_generated/server';

/**
 * Get all referral events (for admin)
 */
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query('referrals').collect();
    },
});
