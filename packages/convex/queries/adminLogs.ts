// @ts-nocheck
import { query } from '../_generated/server';

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query('adminLogs').order('desc').collect();
    return logs;
  },
}); 