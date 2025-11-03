import { mutation, MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import { api } from '../_generated/api';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory,
  ErrorCode
} from '../../../apps/web/lib/errors/convex-exports';

// Helper: check for overlapping logs (simple version)
async function hasOverlap(ctx: MutationCtx, staffId: string, bucket: string, timestamp: number) {
  const existing = await ctx.db
    .query('timelogs')
    .filter(q => q.eq(q.field('staffId'), staffId))
    .filter(q => q.eq(q.field('bucket'), bucket))
    .collect();
  return existing.some(log => log.timestamp === timestamp);
}

function isAdminOrHR(user: any): boolean {
  return user && (user.role === 'admin' || user.role === 'hr' || user.role === 'human_resources');
}

export const createTimelog = mutation({
  args: {
    user: v.string(), // actor's email
    staffId: v.id('users'),
    bucket: v.string(),
    logs: v.array(v.any()),
    timestamp: v.number(),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { user, staffId, bucket, logs, timestamp } = args;
    // Resolve actor's user id
    const actorUser = await ctx.runQuery(api.queries.users.getUserByEmail, { email: user });
    if (!actorUser) return { status: 'error', error: 'Actor not found' };
    // Access control: get staff
    const staff = await ctx.db.get(staffId);
    if (!staff) return { status: 'error', error: 'Staff not found' };
    // Real role check for admin/HR
    if (user !== (staff as any)?.email && !isAdminOrHR(actorUser)) {
      return { status: 'error', error: 'Not authorized' };
    }
    // Validation
    if (!bucket || !logs.length) return { status: 'error', error: 'Missing required fields' };
    if (timestamp > Date.now() + 5 * 60 * 1000) return { status: 'error', error: 'Timestamp cannot be in the future' };
    if (await hasOverlap(ctx, staffId, bucket, timestamp)) {
      return { status: 'error', error: 'Overlapping timelog exists' };
    }
    // Insert with audit fields
    await ctx.db.insert('timelogs', {
      user,
      staffId,
      bucket,
      logs,
      timestamp,
      createdBy: actorUser._id,
      createdAt: Date.now(),
      changeLog: [{ action: 'create', by: actorUser._id, at: Date.now() }],
    });
    return { status: 'ok' };
  },
});

export const updateTimelog = mutation({
  args: {
    timelogId: v.id('timelogs'),
    user: v.string(), // actor's email
    staffId: v.id('users'),
    bucket: v.string(),
    logs: v.array(v.any()),
    timestamp: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { timelogId, user, staffId, bucket, logs, timestamp } = args;
    const timelog = await ctx.db.get(timelogId);
    if (!timelog) return { status: 'error', error: 'Timelog not found' };
    // Resolve actor
    const actorUser = await ctx.runQuery(api.queries.users.getUserByEmail, { email: user });
    if (!actorUser) return { status: 'error', error: 'Actor not found' };
    // Only creator or admin/HR can update
    if (timelog.createdBy !== actorUser._id && !isAdminOrHR(actorUser)) {
      return { status: 'error', error: 'Not authorized' };
    }
    // Validation
    if (!bucket || !logs.length) return { status: 'error', error: 'Missing required fields' };
    if (timestamp > Date.now() + 5 * 60 * 1000) return { status: 'error', error: 'Timestamp cannot be in the future' };
    // Update and log
    const newChangeLog = [
      ...(timelog.changeLog || []),
      { action: 'update', by: actorUser._id, at: Date.now(), details: { staffId, bucket, logs, timestamp } },
    ];
    await ctx.db.patch(timelogId, {
      user,
      staffId,
      bucket,
      logs,
      timestamp,
      updatedBy: actorUser._id,
      updatedAt: Date.now(),
      changeLog: newChangeLog,
    });
    return { status: 'ok' };
  },
});

export const patchTimelog = mutation({
  args: {
    timelogId: v.id('timelogs'),
    updates: v.any(), // Flexible updates object
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { timelogId, updates } = args;
    const timelog = await ctx.db.get(timelogId);
    if (!timelog) return { status: 'error', error: 'Timelog not found' };
    
    // Validation: don't allow changing audit fields
    if (updates.createdBy || updates.createdAt) {
      return { status: 'error', error: 'Cannot change audit fields' };
    }
    
    // Update and log
    const newChangeLog = [
      ...(timelog.changeLog || []),
      { action: 'patch', by: 'system', at: Date.now(), details: updates },
    ];
    
    await ctx.db.patch(timelogId, {
      ...updates,
      updatedAt: Date.now(),
      changeLog: newChangeLog,
    });
    
    return { status: 'ok' };
  },
});

export const deleteTimelog = mutation({
  args: {
    timelogId: v.id('timelogs'),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { timelogId } = args;
    const timelog = await ctx.db.get(timelogId);
    if (!timelog) return { status: 'error', error: 'Timelog not found' };
    
    // Now delete
    await ctx.db.delete(timelogId);
    return { status: 'ok' };
  },
}); 