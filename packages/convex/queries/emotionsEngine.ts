import { v } from 'convex/values';
import { query, QueryCtx } from '../_generated/server';

export const getEmotionsEngineSettings = query({
  args: {
    key: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: QueryCtx, args) => {
    if (args.key) {
      const setting = await ctx.db.query('emotions_engine_settings').filter(q => q.eq(q.field('key'), args.key)).first();
      return setting || null;
    }
    return await ctx.db.query('emotions_engine_settings').collect();
  },
});

export const getAllLogs = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query('emotions_engine_logs').collect();
  },
}); 