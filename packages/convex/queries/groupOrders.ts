import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Get group order by ID
export const getById = query({
  args: { group_order_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('group_orders')
      .withIndex('by_group_order_id', q => q.eq('group_order_id', args.group_order_id))
      .first();
  },
});

// Get group order by share token
export const getByShareToken = query({
  args: { share_token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('group_orders')
      .withIndex('by_share_token', q => q.eq('share_token', args.share_token))
      .first();
  },
});

// Get active group orders for a user (as creator or participant)
export const getActiveByUser = query({
  args: { user_id: v.id('users') },
  handler: async (ctx, args) => {
    // Get orders where user is creator
    const asCreator = await ctx.db
      .query('group_orders')
      .withIndex('by_creator', q => q.eq('created_by', args.user_id))
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    // Get orders where user is participant
    const allActive = await ctx.db
      .query('group_orders')
      .withIndex('by_status', q => q.eq('status', 'active'))
      .collect();
    
    const asParticipant = allActive.filter(go => 
      go.participants.some(p => p.user_id === args.user_id)
    );
    
    // Deduplicate
    const unique = new Map<string, any>();
    [...asCreator, ...asParticipant].forEach(go => {
      unique.set(go._id, go);
    });
    
    return Array.from(unique.values());
  },
});

// Get group orders by status
export const getByStatus = query({
  args: { 
    status: v.union(
      v.literal("active"),
      v.literal("closed"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("on_the_way"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    user_id: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('group_orders')
      .withIndex('by_status', q => q.eq('status', args.status));
    
    const allOrders = await query.collect();
    
    // Filter by user if specified
    if (args.user_id) {
      return allOrders.filter(go => 
        go.created_by === args.user_id || 
        go.participants.some(p => p.user_id === args.user_id)
      );
    }
    
    return allOrders;
  },
});

// Get suggested participants based on user's connections
export const getSuggestedParticipants = query({
  args: { 
    user_id: v.id('users'),
    connection_types: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Call the unified connections query using ctx.runQuery
    const allConnections = await ctx.runQuery(api.queries.userConnections.getAllUserConnections, {
      user_id: args.user_id,
    });
    
    // Filter by connection types if specified
    let filteredConnections = allConnections;
    if (args.connection_types && args.connection_types.length > 0) {
      filteredConnections = allConnections.filter(conn => 
        args.connection_types!.includes(conn.connection_type)
      );
    }
    
    // Enrich with user details
    const enriched = await Promise.all(
      filteredConnections.map(async (conn) => {
        const user = await ctx.db.get(conn.user_id);
        return {
          user_id: conn.user_id,
          user_name: conn.user_name,
          connection_type: conn.connection_type,
          source: conn.source,
          metadata: conn.metadata,
          avatar: user?.avatar,
          email: user?.email,
        };
      })
    );
    
    return enriched;
  },
});

// Get participant's selections
export const getParticipantSelections = query({
  args: {
    group_order_id: v.string(),
    participant_user_id: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    const groupOrder = await ctx.db
      .query('group_orders')
      .withIndex('by_group_order_id', q => q.eq('group_order_id', args.group_order_id))
      .first();
    
    if (!groupOrder) {
      return null;
    }
    
    // If specific participant requested, return that participant's selections
    if (args.participant_user_id) {
      const participant = groupOrder.participants.find(
        p => p.user_id === args.participant_user_id
      );
      
      if (!participant) {
        return null;
      }
      
      return {
        user_id: participant.user_id,
        user_name: participant.user_name,
        user_initials: participant.user_initials,
        user_color: participant.user_color,
        order_items: participant.order_items,
        total_contribution: participant.total_contribution,
        selection_status: participant.selection_status,
        selection_ready_at: participant.selection_ready_at,
      };
    }
    
    // Return all participants' selections
    return groupOrder.participants.map(p => ({
      user_id: p.user_id,
      user_name: p.user_name,
      user_initials: p.user_initials,
      user_color: p.user_color,
      order_items: p.order_items,
      total_contribution: p.total_contribution,
      selection_status: p.selection_status,
      selection_ready_at: p.selection_ready_at,
    }));
  },
});

// Get budget contributions
export const getBudgetContributions = query({
  args: { group_order_id: v.string() },
  handler: async (ctx, args) => {
    const groupOrder = await ctx.db
      .query('group_orders')
      .withIndex('by_group_order_id', q => q.eq('group_order_id', args.group_order_id))
      .first();
    
    if (!groupOrder) {
      return null;
    }
    
    // Enrich budget contributions with user details
    const enrichedContributions = await Promise.all(
      groupOrder.budget_contributions.map(async (contrib) => {
        const user = await ctx.db.get(contrib.user_id);
        const participant = groupOrder.participants.find(p => p.user_id === contrib.user_id);
        
        return {
          user_id: contrib.user_id,
          user_name: user?.name || 'Unknown',
          user_initials: participant?.user_initials || 'U',
          user_color: participant?.user_color,
          amount: contrib.amount,
          contributed_at: contrib.contributed_at,
        };
      })
    );
    
    return {
      initial_budget: groupOrder.initial_budget,
      total_budget: groupOrder.total_budget,
      contributions: enrichedContributions,
      participants_summary: groupOrder.participants.map(p => ({
        user_id: p.user_id,
        user_name: p.user_name,
        budget_contribution: p.budget_contribution,
      })),
    };
  },
});

// Get group order status summary
export const getGroupOrderStatus = query({
  args: { group_order_id: v.string() },
  handler: async (ctx, args) => {
    const groupOrder = await ctx.db
      .query('group_orders')
      .withIndex('by_group_order_id', q => q.eq('group_order_id', args.group_order_id))
      .first();
    
    if (!groupOrder) {
      return null;
    }
    
    const readyCount = groupOrder.participants.filter(p => p.selection_status === 'ready').length;
    const notReadyCount = groupOrder.participants.filter(p => p.selection_status === 'not_ready').length;
    const allReady = groupOrder.participants.length > 0 && readyCount === groupOrder.participants.length;
    
    return {
      selection_phase: groupOrder.selection_phase,
      status: groupOrder.status,
      budget: {
        initial_budget: groupOrder.initial_budget,
        total_budget: groupOrder.total_budget,
        contributions_count: groupOrder.budget_contributions.length,
      },
      selections: {
        total_participants: groupOrder.participants.length,
        ready_count: readyCount,
        not_ready_count: notReadyCount,
        all_ready: allReady,
      },
      order: {
        total_amount: groupOrder.total_amount,
        discount_amount: groupOrder.discount_amount,
        final_amount: groupOrder.final_amount,
      },
    };
  },
});

