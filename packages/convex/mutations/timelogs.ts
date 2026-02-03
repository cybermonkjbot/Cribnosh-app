// @ts-nocheck
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
import { requireAuth, isAdmin, isStaff, isHROrAdmin } from '../utils/auth';

// Helper: check for overlapping logs (simple version)
async function hasOverlap(ctx: MutationCtx, staffId: string, bucket: string, timestamp: number) {
  const existing = await ctx.db
    .query('timelogs')
    .filter(q => q.eq(q.field('staffId'), staffId))
    .filter(q => q.eq(q.field('bucket'), bucket))
    .collect();
  return existing.some(log => log.timestamp === timestamp);
}

// Use centralized auth utilities instead

export const createTimelog = mutation({
  args: {
    user: v.string(), // actor's email
    staffId: v.id('users'),
    bucket: v.string(),
    logs: v.array(v.any()),
    timestamp: v.number(),
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const { staffId, bucket, logs, timestamp } = args;
    
    // Access control: get staff
    const staff = await ctx.db.get(staffId);
    if (!staff) return { status: 'error', error: 'Staff not found' };
    
    // Users can only create timelogs for themselves unless they're staff/admin
    if (!isAdmin(user) && !isStaff(user) && staffId !== user._id) {
      return { status: 'error', error: 'Access denied' };
    }
    // Validation
    if (!bucket || !logs.length) return { status: 'error', error: 'Missing required fields' };
    if (timestamp > Date.now() + 5 * 60 * 1000) return { status: 'error', error: 'Timestamp cannot be in the future' };
    if (await hasOverlap(ctx, staffId, bucket, timestamp)) {
      return { status: 'error', error: 'Overlapping timelog exists' };
    }
    // Insert with audit fields
    await ctx.db.insert('timelogs', {
      user: user.email,
      staffId,
      bucket,
      logs,
      timestamp,
      createdBy: user._id,
      createdAt: Date.now(),
      changeLog: [{ action: 'create', by: user._id, at: Date.now() }],
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
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const { timelogId, staffId, bucket, logs, timestamp } = args;
    const timelog = await ctx.db.get(timelogId);
    if (!timelog) return { status: 'error', error: 'Timelog not found' };
    
    // Only creator or admin/HR can update
    if (timelog.createdBy !== user._id && !isAdmin(user) && !isHROrAdmin(user)) {
      return { status: 'error', error: 'Access denied' };
    }
    
    // Users can only update timelogs for themselves unless they're staff/admin
    if (!isAdmin(user) && !isStaff(user) && staffId !== user._id) {
      return { status: 'error', error: 'Access denied' };
    }
    // Validation
    if (!bucket || !logs.length) return { status: 'error', error: 'Missing required fields' };
    if (timestamp > Date.now() + 5 * 60 * 1000) return { status: 'error', error: 'Timestamp cannot be in the future' };
    // Update and log
    const newChangeLog = [
      ...(timelog.changeLog || []),
      { action: 'update', by: user._id, at: Date.now(), details: { staffId, bucket, logs, timestamp } },
    ];
    await ctx.db.patch(timelogId, {
      user: user.email,
      staffId,
      bucket,
      logs,
      timestamp,
      updatedBy: user._id,
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
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const { timelogId, updates } = args;
    const timelog = await ctx.db.get(timelogId);
    if (!timelog) return { status: 'error', error: 'Timelog not found' };
    
    // Only creator or admin/HR can patch
    if (timelog.createdBy !== user._id && !isAdmin(user) && !isHROrAdmin(user)) {
      return { status: 'error', error: 'Access denied' };
    }
    
    // Validation: don't allow changing audit fields
    if (updates.createdBy || updates.createdAt) {
      return { status: 'error', error: 'Cannot change audit fields' };
    }
    
    // Update and log
    const newChangeLog = [
      ...(timelog.changeLog || []),
      { action: 'patch', by: user._id, at: Date.now(), details: updates },
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
    sessionToken: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const { timelogId } = args;
    const timelog = await ctx.db.get(timelogId);
    if (!timelog) return { status: 'error', error: 'Timelog not found' };
    
    // Only creator or admin/HR can delete
    if (timelog.createdBy !== user._id && !isAdmin(user) && !isHROrAdmin(user)) {
      return { status: 'error', error: 'Access denied' };
    }
    
    // Now delete
    await ctx.db.delete(timelogId);
    return { status: 'ok' };
  },
}); 