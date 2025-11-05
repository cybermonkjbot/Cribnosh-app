import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Create a treat relationship when user treats someone
export const createTreat = mutation({
  args: {
    treater_id: v.id('users'),
    treated_user_id: v.optional(v.id('users')),
    order_id: v.optional(v.id('orders')),
    expires_in_hours: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresInHours = args.expires_in_hours || 168; // Default 7 days
    const expiresAt = now + (expiresInHours * 60 * 60 * 1000);
    
    // Generate unique treat token
    const treatToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    const treatId = await ctx.db.insert('treats', {
      treater_id: args.treater_id,
      treated_user_id: args.treated_user_id,
      order_id: args.order_id,
      treat_token: treatToken,
      status: 'pending',
      created_at: now,
      expires_at: expiresAt,
      metadata: args.metadata,
    });
    
    return {
      treat_id: treatId,
      treat_token: treatToken,
      expires_at: expiresAt,
    };
  },
});

// Mark treat as claimed when recipient uses it
export const claimTreat = mutation({
  args: {
    treat_token: v.string(),
    treated_user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const treat = await ctx.db
      .query('treats')
      .withIndex('by_token', q => q.eq('treat_token', args.treat_token))
      .first();
    
    if (!treat) {
      throw new Error('Treat not found');
    }
    
    if (treat.status !== 'pending') {
      throw new Error(`Treat is already ${treat.status}`);
    }
    
    if (treat.expires_at && treat.expires_at < Date.now()) {
      // Mark as expired
      await ctx.db.patch(treat._id, {
        status: 'expired',
      });
      throw new Error('Treat has expired');
    }
    
    const now = Date.now();
    
    // Update treat with recipient and mark as claimed
    await ctx.db.patch(treat._id, {
      treated_user_id: args.treated_user_id,
      status: 'claimed',
      claimed_at: now,
    });
    
    return {
      success: true,
      treat_id: treat._id,
    };
  },
});

// Get treat by share token (query-like but needs to update, so mutation)
export const getTreatByToken = mutation({
  args: {
    treat_token: v.string(),
  },
  handler: async (ctx, args) => {
    const treat = await ctx.db
      .query('treats')
      .withIndex('by_token', q => q.eq('treat_token', args.treat_token))
      .first();
    
    if (!treat) {
      return null;
    }
    
    // Check if expired
    if (treat.expires_at && treat.expires_at < Date.now() && treat.status === 'pending') {
      await ctx.db.patch(treat._id, {
        status: 'expired',
      });
      return {
        ...treat,
        status: 'expired' as const,
      };
    }
    
    return treat;
  },
});

