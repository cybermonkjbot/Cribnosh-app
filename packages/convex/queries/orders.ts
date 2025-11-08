import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { query } from '../_generated/server';
import { isAdmin, requireAuth } from '../utils/auth';

export const listByChef = query({
  args: { chef_id: v.string() },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Only allow if user is admin, or if they own the chef account
    // For now, we'll require admin or staff for chef queries
    // In a full implementation, you'd check if user owns the chef account
    if (!isAdmin(user)) {
      // Check if user is the chef (would need chef-user relationship)
      // For now, require staff/admin
      const { isStaff } = await import('../utils/auth');
      if (!isStaff(user)) {
        throw new Error('Access denied');
      }
    }
    
    return await ctx.db.query('orders').filter(q => q.eq(q.field('chef_id'), args.chef_id)).collect();
  },
});

export const getById = query({
  args: { order_id: v.string() },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    const order = await ctx.db.query('orders').filter(q => q.eq(q.field('order_id'), args.order_id)).first();
    if (!order) return null;
    
    // Only allow if user is admin/staff, or if they are the customer
    if (!isAdmin(user)) {
      const { isStaff } = await import('../utils/auth');
      if (!isStaff(user)) {
        // Check if user is the customer
        if (order.customer_id !== user._id) {
          throw new Error('Access denied');
        }
      }
    }
    
    return order;
  },
});

// Get order by ID
export const getOrderById = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    const order = await ctx.db.query('orders').filter(q => q.eq(q.field('order_id'), args.orderId)).first();
    if (!order) return null;
    
    // Only allow if user is admin/staff, or if they are the customer
    if (!isAdmin(user)) {
      const { isStaff } = await import('../utils/auth');
      if (!isStaff(user)) {
        // Check if user is the customer
        if (order.customer_id !== user._id) {
          throw new Error('Access denied');
        }
      }
    }
    
    return order;
  },
});

// Get orders with refund eligibility information
export const getOrdersWithRefundEligibility = query({
  args: {
    customerId: v.optional(v.id('users')),
    status: v.optional(v.union(
      v.literal('refundable'),
      v.literal('non-refundable'),
      v.literal('expired')
    )),
    limit: v.number(),
    offset: v.number(),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // If customerId is specified, ensure user can access it
    if (args.customerId) {
      if (!isAdmin(user)) {
        const { isStaff } = await import('../utils/auth');
        if (!isStaff(user) && args.customerId !== user._id) {
          throw new Error('Access denied');
        }
      }
    } else {
      // If no customerId specified, only allow staff/admin
      if (!isAdmin(user)) {
        const { isStaff } = await import('../utils/auth');
        if (!isStaff(user)) {
          // Default to current user's orders
          args.customerId = user._id;
        }
      }
    }
    
    let query = ctx.db.query('orders');
    
    // Filter by customer if specified
    if (args.customerId) {
      query = query.filter(q => q.eq(q.field('customer_id'), args.customerId));
    }
    
    // Filter by refund eligibility status
    if (args.status) {
      const now = Date.now();
      
      switch (args.status) {
        case 'refundable':
          query = query.filter(q => 
            q.and(
              q.eq(q.field('is_refundable'), true),
              q.or(
                q.eq(q.field('order_status'), 'delivered'),
                q.neq(q.field('order_status'), 'delivered')
              )
            )
          );
          break;
        case 'non-refundable':
          query = query.filter(q => 
            q.or(
              q.eq(q.field('is_refundable'), false),
              q.eq(q.field('order_status'), 'completed'),
              q.eq(q.field('order_status'), 'cancelled')
            )
          );
          break;
        case 'expired':
          query = query.filter(q => 
            q.and(
              q.eq(q.field('order_status'), 'delivered'),
              q.neq(q.field('refund_eligible_until'), undefined),
              q.lt(q.field('refund_eligible_until'), now)
            )
          );
          break;
      }
    }
    
    // Get all results and apply pagination manually
    const allOrders = await query.collect();
    
    // Sort by creation date (newest first) and apply pagination
    const sortedOrders = allOrders.sort((a, b) => b.createdAt - a.createdAt);
    const startIndex = args.offset;
    const endIndex = startIndex + args.limit;
    
    return sortedOrders.slice(startIndex, endIndex);
  },
});

// Get refund eligibility summary statistics
export const getRefundEligibilitySummary = query({
  args: {
    customerId: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // If customerId is specified, ensure user can access it
    if (args.customerId) {
      if (!isAdmin(user)) {
        const { isStaff } = await import('../utils/auth');
        if (!isStaff(user) && args.customerId !== user._id) {
          throw new Error('Access denied');
        }
      }
    } else {
      // If no customerId specified, only allow staff/admin
      if (!isAdmin(user)) {
        const { isStaff } = await import('../utils/auth');
        if (!isStaff(user)) {
          // Default to current user's orders
          args.customerId = user._id;
        }
      }
    }
    
    const now = Date.now();
    let baseQuery = ctx.db.query('orders');
    
    if (args.customerId) {
      baseQuery = baseQuery.filter(q => q.eq(q.field('customer_id'), args.customerId));
    }
    
    const allOrders = await baseQuery.collect();
    
    const summary = {
      totalOrders: allOrders.length,
      refundable: 0,
      nonRefundable: 0,
      expired: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0
    };

    allOrders.forEach(order => {
      // Count by status
      if (order.order_status) {
        summary[order.order_status as keyof typeof summary]++;
      }

      // Count by refund eligibility
      if (order.is_refundable === true) {
        summary.refundable++;
      } else if (order.is_refundable === false) {
        summary.nonRefundable++;
      } else if (order.delivered_at && order.refund_eligible_until && now > order.refund_eligible_until) {
        summary.expired++;
      }
    });

    return summary;
  },
});

// Get order history
export const getOrderHistory = query({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query('orderHistory')
      .filter(q => q.eq(q.field('order_id'), args.orderId))
      .order('desc')
      .collect();

    return history;
  },
});

// Get order notes
export const getOrderNotes = query({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query('orderNotes')
      .filter(q => q.eq(q.field('order_id'), args.orderId))
      .order('desc')
      .collect();

    return notes;
  },
});

// Get order notifications
export const getOrderNotifications = query({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('orderNotifications')
      .filter(q => q.eq(q.field('order_id'), args.orderId))
      .order('desc')
      .collect();

    return notifications;
  },
});

// Get order messages
export const getOrderMessages = query({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('orderMessages')
      .filter(q => q.eq(q.field('order_id'), args.orderId))
      .order('desc')
      .collect();

    return messages;
  },
});

export const listByCustomer = query({
  args: { 
    customer_id: v.string(),
    status: v.optional(v.union(
      v.literal("ongoing"),
      v.literal("past"),
      v.literal("all")
    )),
    order_type: v.optional(v.union(
      v.literal("individual"),
      v.literal("group"),
      v.literal("all")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Ensure user can only access their own orders unless they're staff/admin
    if (!isAdmin(user)) {
      const { isStaff } = await import('../utils/auth');
      if (!isStaff(user) && args.customer_id !== user._id.toString()) {
        throw new Error('Access denied');
      }
    }
    let query = ctx.db
      .query('orders')
      .withIndex('by_customer', q => q.eq('customer_id', args.customer_id as Id<'users'>));
    
    const allOrders = await query.collect();
    
    // Apply status filter
    let filtered = allOrders;
    if (args.status && args.status !== "all") {
      const ongoingStatuses = ["pending", "confirmed", "preparing", "ready", "on_the_way"];
      if (args.status === "ongoing") {
        filtered = filtered.filter(o => ongoingStatuses.includes(o.order_status));
      } else if (args.status === "past") {
        filtered = filtered.filter(o => 
          o.order_status === "delivered" || o.order_status === "cancelled"
        );
      }
    }
    
    // Apply order type filter
    if (args.order_type && args.order_type !== "all") {
      filtered = filtered.filter(o => {
        if (args.order_type === "group") {
          return o.is_group_order === true;
        } else {
          return o.is_group_order !== true;
        }
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    // Pagination - only paginate if limit is explicitly provided
    let paginated = filtered;
    if (args.limit !== undefined) {
    const offset = args.offset || 0;
      const limit = args.limit;
      paginated = filtered.slice(offset, offset + limit);
    }
    
    // Enrich with group order data if applicable
    const enriched = await Promise.all(paginated.map(async (order) => {
      if (order.is_group_order && order.group_order_id) {
        const groupOrder = await ctx.db.get(order.group_order_id);
        return {
          ...order,
          group_order_details: groupOrder ? {
            participants: groupOrder.participants.map(p => ({
              user_id: p.user_id,
              user_name: p.user_name,
              user_initials: p.user_initials,
              user_color: p.user_color,
              total_contribution: p.total_contribution,
            })),
            total_participants: groupOrder.participants.length,
          } : null,
        };
      }
      return order;
    }));
    
    return enriched;
  },
});

export const getRecentOrders = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Ensure user can only access their own orders unless they're staff/admin
    if (!isAdmin(user)) {
      const { isStaff } = await import('../utils/auth');
      if (!isStaff(user) && args.userId !== user._id) {
        throw new Error('Access denied');
      }
    }
    
    const { userId, limit = 10 } = args;
    const orders = await ctx.db
      .query('orders')
      .filter(q => q.eq(q.field('customer_id'), userId))
      .order('desc')
      .take(limit);
    
    return orders.map(order => ({
      id: order._id,
      status: order.order_status,
      createdAt: order._creationTime,
      total: order.total_amount,
      items: order.order_items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })) || []
    }));
  },
});

// Get user's cart
export const getUserCart = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Ensure user can only access their own cart unless they're staff/admin
    if (!isAdmin(user)) {
      const { isStaff } = await import('../utils/auth');
      if (!isStaff(user) && args.userId !== user._id) {
        throw new Error('Access denied');
      }
    }
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    
    return cart || {
      userId: args.userId,
      items: [],
      updatedAt: Date.now()
    };
  },
});