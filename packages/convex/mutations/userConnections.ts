import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Manually add colleague/friend connection
export const createConnection = mutation({
  args: {
    user_id: v.id('users'),
    connected_user_id: v.id('users'),
    connection_type: v.union(v.literal('colleague'), v.literal('friend')),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if connection already exists
    const existing = await ctx.db
      .query('user_connections')
      .withIndex('by_user_connected', q => 
        q.eq('user_id', args.user_id).eq('connected_user_id', args.connected_user_id)
      )
      .first();
    
    if (existing && existing.status === 'active') {
      throw new Error('Connection already exists');
    }
    
    const now = Date.now();
    
    // Create bidirectional connection (A -> B and B -> A)
    // First connection: user_id -> connected_user_id
    if (existing) {
      // Update existing connection
      await ctx.db.patch(existing._id, {
        connection_type: args.connection_type,
        company: args.company,
        status: 'active',
        updated_at: now,
      });
    } else {
      await ctx.db.insert('user_connections', {
        user_id: args.user_id,
        connected_user_id: args.connected_user_id,
        connection_type: args.connection_type,
        company: args.company,
        status: 'active',
        created_at: now,
      });
    }
    
    // Second connection: connected_user_id -> user_id (bidirectional)
    const reverseExisting = await ctx.db
      .query('user_connections')
      .withIndex('by_user_connected', q => 
        q.eq('user_id', args.connected_user_id).eq('connected_user_id', args.user_id)
      )
      .first();
    
    if (reverseExisting) {
      await ctx.db.patch(reverseExisting._id, {
        connection_type: args.connection_type,
        company: args.company,
        status: 'active',
        updated_at: now,
      });
    } else {
      await ctx.db.insert('user_connections', {
        user_id: args.connected_user_id,
        connected_user_id: args.user_id,
        connection_type: args.connection_type,
        company: args.company,
        status: 'active',
        created_at: now,
      });
    }
    
    return { success: true };
  },
});

// Remove a connection
export const removeConnection = mutation({
  args: {
    connection_id: v.id('user_connections'),
    user_id: v.id('users'),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connection_id);
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    if (connection.user_id !== args.user_id) {
      throw new Error('Only the connection owner can remove it');
    }
    
    const now = Date.now();
    
    // Mark connection as removed (bidirectional)
    await ctx.db.patch(args.connection_id, {
      status: 'removed',
      updated_at: now,
    });
    
    // Also remove the reverse connection
    const reverseConnection = await ctx.db
      .query('user_connections')
      .withIndex('by_user_connected', q => 
        q.eq('user_id', connection.connected_user_id).eq('connected_user_id', connection.user_id)
      )
      .first();
    
    if (reverseConnection) {
      await ctx.db.patch(reverseConnection._id, {
        status: 'removed',
        updated_at: now,
      });
    }
    
    return { success: true };
  },
});

// Update connection status
export const updateConnectionStatus = mutation({
  args: {
    connection_id: v.id('user_connections'),
    user_id: v.id('users'),
    status: v.union(v.literal('active'), v.literal('removed'), v.literal('blocked')),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connection_id);
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    if (connection.user_id !== args.user_id) {
      throw new Error('Only the connection owner can update it');
    }
    
    const now = Date.now();
    
    await ctx.db.patch(args.connection_id, {
      status: args.status,
      updated_at: now,
    });
    
    // Update reverse connection if needed
    if (args.status === 'blocked' || args.status === 'removed') {
      const reverseConnection = await ctx.db
        .query('user_connections')
        .withIndex('by_user_connected', q => 
          q.eq('user_id', connection.connected_user_id).eq('connected_user_id', connection.user_id)
        )
        .first();
      
      if (reverseConnection) {
        await ctx.db.patch(reverseConnection._id, {
          status: args.status,
          updated_at: now,
        });
      }
    }
    
    return { success: true };
  },
});

