import { v } from 'convex/values';
import { api } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { query } from '../_generated/server';
import { getAuthenticatedUser, isAdmin, isStaff, requireAuth } from '../utils/auth';

export const listByChef = query({
  args: {
    chef_id: v.string(),
    sessionToken: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // chef_id can be either:
    // 1. A userId string (legacy behavior from web API)
    // 2. A chef document ID (from mobile chef app)
    let chef;

    // First, try to get chef by document ID (in case chef_id is a chef._id)
    try {
      chef = await ctx.db.get(args.chef_id as Id<'chefs'>);
    } catch (error) {
      // Not a valid chef document ID, continue to try userId
    }

    // If not found by document ID, try by userId
    if (!chef) {
      chef = await ctx.db
        .query('chefs')
        .filter(q => q.eq(q.field('userId'), args.chef_id))
        .first();
    }

    // If chef not found, user doesn't have a chef profile
    if (!chef) {
      throw new Error('Access denied');
    }

    // Allow if user is admin/staff, or if they own the chef account
    if (!isAdmin(user) && !isStaff(user)) {
      if (chef.userId !== user._id) {
        throw new Error('Access denied');
      }
    }

    const { limit, offset = 0 } = args;

    // Fetch orders filtered by chef_id (using the actual chef._id)
    const allOrders = await ctx.db
      .query('orders')
      .filter(q => q.eq(q.field('chef_id'), chef._id))
      .collect();

    // Sort by createdAt desc (newest first)
    allOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Apply pagination
    if (limit !== undefined) {
      return allOrders.slice(offset, offset + limit);
    }

    // If no limit, return all from offset
    return allOrders.slice(offset);
  },
});

export const getById = query({
  args: {
    order_id: v.string(),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    const order = await ctx.db.query('orders').filter(q => q.eq(q.field('order_id'), args.order_id)).first();
    if (!order) return null;

    // Only allow if user is admin/staff, or if they are the customer
    if (!isAdmin(user)) {
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
  args: {
    orderId: v.string(),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    const order = await ctx.db.query('orders').filter(q => q.eq(q.field('order_id'), args.orderId)).first();
    if (!order) return null;

    // Only allow if user is admin/staff, or if they are the customer
    if (!isAdmin(user)) {
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
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // If customerId is specified, ensure user can access it
    if (args.customerId) {
      if (!isAdmin(user)) {
        if (!isStaff(user) && args.customerId !== user._id) {
          throw new Error('Access denied');
        }
      }
    } else {
      // If no customerId specified, only allow staff/admin
      if (!isAdmin(user)) {
        if (!isStaff(user)) {
          // Default to current user's orders
          args.customerId = user._id;
        }
      }
    }

    let query = ctx.db.query('orders');

    // Filter by customer if specified
    if (args.customerId) {
      query = query.filter((q: any) => q.eq(q.field('customer_id'), args.customerId));
    }

    // Filter by refund eligibility status
    if (args.status) {
      const now = Date.now();

      switch (args.status) {
        case 'refundable':
          query = query.filter((q: any) =>
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
          query = query.filter((q: any) =>
            q.or(
              q.eq(q.field('is_refundable'), false),
              q.eq(q.field('order_status'), 'completed'),
              q.eq(q.field('order_status'), 'cancelled')
            )
          );
          break;
        case 'expired':
          query = query.filter((q: any) =>
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
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // If customerId is specified, ensure user can access it
    if (args.customerId) {
      if (!isAdmin(user)) {
        if (!isStaff(user) && args.customerId !== user._id) {
          throw new Error('Access denied');
        }
      }
    } else {
      // If no customerId specified, only allow staff/admin
      if (!isAdmin(user)) {
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
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check authentication - return empty array if not authenticated instead of throwing
    const user = await getAuthenticatedUser(ctx, args.sessionToken);

    // If not authenticated, return empty array (graceful degradation)
    if (!user) {
      return [];
    }

    // Ensure user can only access their own orders unless they're staff/admin
    if (!isAdmin(user)) {
      if (!isStaff(user) && args.customer_id !== user._id.toString()) {
        throw new Error('Access denied');
      }
    }
    let query = ctx.db
      .query('orders')
      .withIndex('by_customer', (q: any) => q.eq('customer_id', args.customer_id as Id<'users'>));

    const allOrders = await query.collect();

    // Apply status filter
    let filtered = allOrders;
    if (args.status && args.status !== "all") {
      const ongoingStatuses = ["pending", "confirmed", "preparing", "ready", "on_the_way"];
      if (args.status === "ongoing") {
        filtered = filtered.filter((o: any) => ongoingStatuses.includes(o.order_status));
      } else if (args.status === "past") {
        filtered = filtered.filter(o =>
          o.order_status === "delivered" || o.order_status === "cancelled"
        );
      }
    }

    // Apply order type filter
    if (args.order_type && args.order_type !== "all") {
      filtered = filtered.filter((o: any) => {
        if (args.order_type === "group") {
          return o.is_group_order === true;
        } else {
          return o.is_group_order !== true;
        }
      });
    }

    // Sort by date (newest first)
    filtered.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    // Pagination - only paginate if limit is explicitly provided
    let paginated = filtered;
    if (args.limit !== undefined) {
      const offset = args.offset || 0;
      const limit = args.limit;
      paginated = filtered.slice(offset, offset + limit);
    }

    // Enrich with group order data and kitchen name
    const enriched = await Promise.all(paginated.map(async (order) => {
      // Fetch kitchen/chef name
      let kitchenName = null;
      try {
        const chef = await ctx.runQuery(api.queries.chefs.getById, {
          chefId: order.chef_id as any,
        });
        kitchenName = chef?.name || null;
      } catch (error) {
        // If chef not found, kitchenName remains null
        console.error('Error fetching chef for order:', error);
      }

      // Enrich order items with meal images
      const enrichedOrderItems = await Promise.all(
        (order.order_items || []).map(async (item) => {
          try {
            // Get meal details using dish_id
            const meal = await ctx.runQuery(api.queries.meals.getById, {
              mealId: item.dish_id as any,
            });

            // Get first image URL if available
            let imageUrl: string | undefined = undefined;
            if (meal?.images && Array.isArray(meal.images) && meal.images.length > 0) {
              const firstImage = meal.images[0];

              // Check if it's already a URL
              if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
                imageUrl = firstImage;
              } else {
                // Assume it's a Convex storage ID - try to get URL
                try {
                  // Convex storage IDs are valid Id<'storage'> types
                  imageUrl = await ctx.storage.getUrl(firstImage as any);
                  if (!imageUrl) {
                    console.error('Storage getUrl returned null for:', firstImage, 'meal:', meal._id);
                  }
                } catch (error) {
                  console.error('Failed to get storage URL for image:', {
                    imageId: firstImage,
                    mealId: meal._id,
                    mealName: meal.name,
                    error: error instanceof Error ? error.message : String(error),
                  });
                  // Don't set imageUrl if storage.getUrl fails
                  imageUrl = undefined;
                }
              }
            } else {
              console.log('Meal has no images:', {
                mealId: meal?._id,
                mealName: meal?.name,
                dish_id: item.dish_id,
                hasImages: !!meal?.images,
                imagesLength: meal?.images?.length || 0,
              });
            }

            return {
              ...item,
              image_url: imageUrl,
              imageUrl: imageUrl, // Also include imageUrl for compatibility
            };
          } catch (error) {
            // If meal not found, return item without image
            console.error('Error enriching order item with meal data:', {
              dish_id: item.dish_id,
              itemName: item.name,
              error: error instanceof Error ? error.message : String(error),
            });
            return {
              ...item,
              image_url: undefined,
              imageUrl: undefined,
            };
          }
        })
      );

      const baseOrder = {
        ...order,
        kitchen_name: kitchenName,
        restaurant_name: kitchenName, // Also set restaurant_name for compatibility
        order_items: enrichedOrderItems, // Replace with enriched items
      };

      // Enrich with group order data if applicable
      if (order.is_group_order && order.group_order_id) {
        const groupOrder = await ctx.db.get(order.group_order_id);
        return {
          ...baseOrder,
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
      return baseOrder;
    }));

    return enriched;
  },
});

export const getRecentOrders = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Ensure user can only access their own orders unless they're staff/admin
    if (!isAdmin(user)) {
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
      items: (order.order_items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })) || []
    }));
  },
});

// Get user's cart
export const getUserCart = query({
  args: {
    userId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Ensure user can only access their own cart unless they're staff/admin
    if (!isAdmin(user)) {
      if (!isStaff(user) && args.userId !== user._id) {
        throw new Error('Access denied');
      }
    }
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first();

    return cart || {
      userId: args.userId,
      items: [],
      updatedAt: Date.now()
    };
  },
});

// Get user's cart by session token (for reactive queries in mobile app)
export const getUserCartBySessionToken = query({
  args: {
    sessionToken: v.string()
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    if (!user) {
      return {
        userId: null,
        items: [],
        updatedAt: Date.now()
      };
    }

    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .first();

    return cart || {
      userId: user._id,
      items: [],
      updatedAt: Date.now()
    };
  },
});

// Get order by payment link token (Public access for payer)
export const getOrderByPaymentToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // No auth check required - this is public so payers can see what they are paying for
    // However, we should limit the data returned to avoid leaking sensitive info

    if (!args.token) return null;

    const order = await ctx.db
      .query('orders')
      .withIndex('by_payment_link_token', (q) => q.eq('payment_link_token', args.token))
      .first();

    if (!order) return null;

    // Return limited details
    return {
      _id: order._id,
      order_id: order.order_id,
      payment_status: order.payment_status,
      total_amount: order.total_amount,
      items: order.order_items,
      createdAt: order.createdAt,
      // Do NOT return customer_id, address, phone, etc.
    };
  },
});

// Get enriched order by session token and order ID (for reactive order details in mobile app)
export const getEnrichedOrderBySessionToken = query({
  args: {
    sessionToken: v.string(),
    order_id: v.string()
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    if (!user) {
      return null;
    }

    // The order_id parameter can be either:
    // 1. A Convex document ID (like "k123abc" - starts with a letter)
    // 2. An order_id string field (like "order_1234567890_abc123")
    let order = null;

    // First, try to get by document ID if it looks like a Convex ID
    // Convex IDs typically start with a lowercase letter (k, j, etc.)
    if (args.order_id.match(/^[a-z][a-z0-9]*$/)) {
      try {
        // Try to get by document ID
        order = await ctx.db.get(args.order_id as any);
        // If found but it's not from the 'orders' table, set to null
        if (order && !('order_id' in order || 'customer_id' in order)) {
          order = null;
        }
      } catch (error) {
        // Not a valid document ID or doesn't exist, continue to search by order_id field
        order = null;
      }
    }

    // If not found by document ID, try searching by order_id field
    if (!order) {
      order = await ctx.db
        .query('orders')
        .filter(q => q.eq(q.field('order_id'), args.order_id))
        .first();
    }

    if (!order) {
      return null;
    }

    // Verify ownership
    if (!isAdmin(user) && !isStaff(user)) {
      if (order.customer_id !== user._id && order.customer_id.toString() !== user._id.toString()) {
        return null; // Return null instead of throwing for better UX
      }
    }

    // Fetch chef/kitchen name and phone if available
    let kitchenName = 'Unknown Kitchen';
    let kitchenPhone = null;
    try {
      const chef = await ctx.runQuery(api.queries.chefs.getById, {
        chefId: order.chef_id as any,
      });
      kitchenName = chef?.name || 'Unknown Kitchen';

      // Get kitchen phone from user
      if (chef?.userId) {
        const user = await ctx.db.get(chef.userId);
        kitchenPhone = user?.phone_number || null;
      }
    } catch (error) {
      // Chef not found, use default
    }

    // Get delivery person info if available
    let deliveryPerson = null;
    try {
      const assignment = await ctx.db
        .query('deliveryAssignments')
        .filter(q => q.eq(q.field('order_id'), order._id))
        .first();

      if (assignment) {
        const driver = await ctx.db.get(assignment.driver_id);
        if (driver) {
          deliveryPerson = {
            id: driver._id,
            name: driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Delivery Driver',
            phone: driver.phone || null,
            location: driver.currentLocation || null,
            vehicleType: driver.vehicleType || null,
            rating: driver.rating || null,
          };
        }
      }
    } catch (error) {
      // Delivery assignment not found, continue without it
    }

    // Get delivery fee - check order first, then deliveries table
    let deliveryFee = order.delivery_fee || null;
    if (deliveryFee === null || deliveryFee === undefined) {
      try {
        // Check deliveries table
        const delivery = await ctx.db
          .query('deliveries')
          .filter(q => q.eq(q.field('orderId'), order._id))
          .first();
        if (delivery) {
          deliveryFee = delivery.deliveryFee || null;
        }
      } catch (error) {
        // Delivery not found, keep as null
      }
    }

    // Transform delivery_address to match expected format (postcode -> postal_code, add state if missing)
    let deliveryAddress = null;
    if (order.delivery_address) {
      deliveryAddress = {
        street: order.delivery_address.street || '',
        city: order.delivery_address.city || '',
        state: order.delivery_address.state || '', // May not exist in schema
        postal_code: order.delivery_address.postcode || order.delivery_address.postal_code || '',
        country: order.delivery_address.country || 'UK',
      };
    }

    // Calculate subtotal from order items if not stored
    const subtotal = order.subtotal || (order.order_items || []).reduce((sum: number, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);

    // Transform to standardized format (matching the action format and screen expectations)
    const orderData = {
      id: order._id,
      _id: order._id,
      customerId: order.customer_id,
      chefId: order.chef_id,
      orderDate: new Date(order.order_date || order.createdAt || Date.now()).toISOString(),
      totalAmount: order.total_amount,
      total: order.total_amount,
      orderStatus: order.order_status,
      status: order.order_status,
      specialInstructions: order.special_instructions || null,
      special_instructions: order.special_instructions || null,
      estimatedPrepTimeMinutes: order.estimated_prep_time_minutes || null,
      estimated_prep_time_minutes: order.estimated_prep_time_minutes || null,
      chefNotes: order.chef_notes || null,
      chef_notes: order.chef_notes || null,
      paymentStatus: order.payment_status,
      payment_status: order.payment_status,
      // Enrich order items with meal images
      orderItems: await Promise.all(
        (order.order_items || []).map(async (item) => {
          try {
            // Get meal details using dish_id
            const meal = await ctx.runQuery(api.queries.meals.getById, {
              mealId: item.dish_id as any,
            });

            // Get first image URL if available
            let imageUrl: string | undefined = undefined;
            if (meal?.images && Array.isArray(meal.images) && meal.images.length > 0) {
              const firstImage = meal.images[0];

              // Check if it's already a URL
              if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
                imageUrl = firstImage;
              } else {
                // Assume it's a Convex storage ID - try to get URL
                try {
                  imageUrl = await ctx.storage.getUrl(firstImage as any);
                  if (!imageUrl) {
                    console.error('Storage getUrl returned null for:', firstImage, 'meal:', meal._id);
                  }
                } catch (error) {
                  console.error('Failed to get storage URL for image:', {
                    imageId: firstImage,
                    mealId: meal._id,
                    mealName: meal.name,
                    error: error instanceof Error ? error.message : String(error),
                  });
                  imageUrl = undefined;
                }
              }
            } else {
              console.log('Meal has no images:', {
                mealId: meal?._id,
                mealName: meal?.name,
                dish_id: item.dish_id,
                hasImages: !!meal?.images,
                imagesLength: meal?.images?.length || 0,
              });
            }

            return {
              ...item,
              image_url: imageUrl,
              imageUrl: imageUrl,
            };
          } catch (error) {
            console.error('Error enriching order item with meal data:', {
              dish_id: item.dish_id,
              itemName: item.name,
              error: error instanceof Error ? error.message : String(error),
            });
            return {
              ...item,
              image_url: undefined,
              imageUrl: undefined,
            };
          }
        })
      ),
      items: (order.order_items || []).map((item: any) => ({
        ...item,
        dish_name: item.name || item.dish_name || 'Unknown Dish',
        id: item.dish_id || item.id,
      })),
      // Additional fields that might be needed
      kitchen_id: order.chef_id,
      kitchen_name: kitchenName,
      kitchen_phone: kitchenPhone,
      delivery_address: deliveryAddress,
      delivery_fee: deliveryFee,
      delivery_person: deliveryPerson,
      subtotal: subtotal,
      tax: order.tax || 0,
      created_at: order.created_at || order.createdAt || new Date().toISOString(),
      updated_at: order.updated_at || order.updatedAt || new Date().toISOString(),
      estimated_delivery_time: order.estimated_delivery_time || order.delivery_time,
    };

    return orderData;
  },
});

// Get cart item count by session token (for reactive cart count in mobile app)
export const getCartItemCountBySessionToken = query({
  args: {
    sessionToken: v.string()
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    if (!user) {
      return 0;
    }

    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .first();

    if (!cart || !cart.items || cart.items.length === 0) {
      return 0;
    }

    // Calculate total item count (sum of all quantities)
    return cart.items.reduce((sum: number, item) => sum + (item.quantity || 0), 0);
  },
});

// Get enriched cart by session token (for reactive cart in mobile app)
// This query enriches cart items with meal details, chef info, and image URLs
export const getEnrichedCartBySessionToken = query({
  args: {
    sessionToken: v.string()
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    if (!user) {
      return {
        items: [],
        userId: null,
        updatedAt: Date.now(),
      };
    }

    // Get cart from database
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .first();

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        items: [],
        userId: user._id,
        updatedAt: Date.now(),
      };
    }

    // Enrich cart items with meal and chef details
    const enrichedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          // Get meal details
          const meal = await ctx.runQuery(api.queries.meals.getById, {
            mealId: item.id as any,
          });

          // Get chef details if available
          let chefName: string | undefined;
          let chefProfileImage: string | undefined;
          if (meal?.chefId) {
            try {
              const chef = await ctx.runQuery(api.queries.chefs.getById, {
                chefId: meal.chefId as any,
              });
              chefName = chef?.name;

              // Get chef profile image URL if available
              if (chef?.profileImage) {
                const profileImage = chef.profileImage;
                // Check if it's a Convex storage ID or already a URL
                if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
                  chefProfileImage = profileImage;
                } else if (profileImage.startsWith('k')) {
                  // It's likely a Convex storage ID, get the URL
                  try {
                    chefProfileImage = await ctx.storage.getUrl(profileImage as any);
                  } catch (error) {
                    console.error('Failed to get storage URL for chef profile image:', profileImage, error);
                    // Fallback to relative path
                    chefProfileImage = `/api/files/${profileImage}`;
                  }
                } else {
                  // Fallback to relative path
                  chefProfileImage = `/api/files/${profileImage}`;
                }
              }
            } catch (error) {
              // Chef not found, continue without chef name
            }
          }

          // Get first image URL if available
          let imageUrl: string | undefined = undefined;
          if (meal?.images && Array.isArray(meal.images) && meal.images.length > 0) {
            const firstImage = meal.images[0];
            // Check if it's a Convex storage ID (starts with 'k' and is a valid ID format)
            // or if it's already a URL
            if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
              imageUrl = firstImage;
            } else if (firstImage.startsWith('k')) {
              // It's likely a Convex storage ID, get the URL
              try {
                imageUrl = await ctx.storage.getUrl(firstImage as any);
              } catch (error) {
                console.error('Failed to get storage URL for image:', firstImage, error);
                // Fallback to relative path
                imageUrl = `/api/files/${firstImage}`;
              }
            } else {
              // Fallback to relative path
              imageUrl = `/api/files/${firstImage}`;
            }
          }

          // Include sides if they exist
          const sides = item.sides || [];

          return {
            _id: item.id,
            dish_id: item.id,
            quantity: item.quantity,
            price: item.price || meal?.price || 0,
            total_price: (item.price || meal?.price || 0) * item.quantity,
            name: item.name || meal?.name || 'Unknown Dish',
            dish_name: item.name || meal?.name || 'Unknown Dish', // Also include dish_name for compatibility
            image_url: imageUrl,
            chef_id: meal?.chefId || undefined,
            chef_name: chefName,
            chef_profile_image: chefProfileImage,
            added_at: item.updatedAt || Date.now(),
            sides: sides.length > 0 ? sides : undefined,
          };
        } catch (error) {
          // If meal not found, return item with available data
          return {
            _id: item.id,
            dish_id: item.id,
            quantity: item.quantity,
            price: item.price || 0,
            total_price: (item.price || 0) * item.quantity,
            name: item.name || 'Unknown Dish',
            dish_name: item.name || 'Unknown Dish', // Also include dish_name for compatibility
            image_url: undefined,
            chef_id: undefined,
            chef_name: undefined,
            chef_profile_image: undefined,
            added_at: item.updatedAt || Date.now(),
            sides: item.sides || undefined,
          };
        }
      })
    );

    return {
      items: enrichedItems,
      userId: user._id,
      updatedAt: cart.updatedAt || Date.now(),
    };
  },
});

// Check if any chefs in the cart are offline
export const checkCartChefAvailability = query({
  args: {
    userId: v.id("users"),
    sessionToken: v.optional(v.string())
  },
  returns: v.object({
    allChefsOnline: v.boolean(),
    offlineChefs: v.array(v.object({
      chefId: v.string(),
      chefName: v.string(),
      itemNames: v.array(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Ensure user can only access their own cart unless they're staff/admin
    if (!isAdmin(user)) {
      if (!isStaff(user) && args.userId !== user._id) {
        throw new Error('Access denied');
      }
    }

    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .first();

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        allChefsOnline: true,
        offlineChefs: [],
      };
    }

    // Get all meals to map cart items to meals and extract chef_id
    const allMeals = await ctx.runQuery(api.queries.meals.getAll, {});

    // Group cart items by chef and check availability
    const chefItems = new Map<string, { chefName: string; itemNames: string[] }>();
    const chefIds = new Set<string>();

    for (const cartItem of cart.items) {
      const meal = (allMeals as any[]).find((m: any) => m._id === cartItem.id || m._id === cartItem.dish_id);

      if (!meal) continue;

      const chefId = meal.chefId || meal.chef_id;
      if (!chefId) continue;

      const chefIdStr = chefId.toString();
      chefIds.add(chefIdStr);

      if (!chefItems.has(chefIdStr)) {
        chefItems.set(chefIdStr, {
          chefName: '',
          itemNames: [],
        });
      }

      const itemName = cartItem.name || meal.name || 'Unknown Item';
      chefItems.get(chefIdStr)!.itemNames.push(itemName);
    }

    // Check availability for each chef
    const offlineChefs: Array<{ chefId: string; chefName: string; itemNames: string[] }> = [];

    for (const chefIdStr of chefIds) {
      try {
        const chef = await ctx.db.get(chefIdStr as Id<'chefs'>);
        if (!chef) continue;

        // Update chef name
        if (chefItems.has(chefIdStr)) {
          chefItems.get(chefIdStr)!.chefName = chef.name;
        }

        // Check if chef is online (isAvailable must be explicitly true)
        if (chef.isAvailable !== true) {
          const chefData = chefItems.get(chefIdStr);
          if (chefData) {
            offlineChefs.push({
              chefId: chefIdStr,
              chefName: chefData.chefName || chef.name,
              itemNames: chefData.itemNames,
            });
          }
        }
      } catch (error) {
        // Chef not found or error accessing, skip
        console.warn(`Error checking chef availability for ${chefIdStr}:`, error);
      }
    }

    return {
      allChefsOnline: offlineChefs.length === 0,
      offlineChefs,
    };
  },
});

// Get count of completed orders (servings) for a chef
export const getChefCompletedOrdersCount = query({
  args: {
    chefId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Get authenticated user (optional for public viewing)
    const user = await getAuthenticatedUser(ctx, args.sessionToken);

    // If authenticated and not admin/staff, verify chef ownership
    if (user && !isAdmin(user) && !isStaff(user)) {
      try {
        const chef = await ctx.runQuery(api.queries.chefs.getById, {
          chefId: args.chefId as any,
        });
        if (!chef || chef.userId !== user._id) {
          // For public profiles, allow viewing stats
          // Just continue without throwing error
        }
      } catch (error) {
        // Chef not found or access denied, but allow public viewing
      }
    }

    const orders = await ctx.db
      .query("orders")
      .filter((q) =>
        q.and(
          q.eq(q.field("chef_id"), args.chefId),
          q.eq(q.field("order_status"), "delivered")
        )
      )
      .collect();

    return orders.length;
  },
});

// Get order by payment link token (publicly accessible with valid token)
export const getOrderByPaymentToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find order with matching token
    const order = await ctx.db
      .query('orders')
      .filter(q => q.eq(q.field('payment_link_token'), args.token))
      .first();

    if (!order) {
      return null;
    }

    // Only return un-paid pending orders
    if (order.payment_status === 'paid' || order.order_status === 'cancelled') {
      // We might want to return it to show "Already Paid" screen, but for security let's return limited info or handle in UI
      // For now returning the order so UI can show "Already Paid"
    }

    // Enrich with chef name
    let kitchenName = 'Unknown Kitchen';
    try {
      const chef = await ctx.db.get(order.chef_id);
      if (chef) kitchenName = chef.name;
    } catch (e) {
      // ignore
    }

    return {
      _id: order._id,
      order_id: order.order_id,
      total_amount: order.total_amount,
      status: order.order_status,
      payment_status: order.payment_status,
      customer_id: order.customer_id,
      kitchen_name: kitchenName,
      items: order.order_items, // minimal details
    };
  },
});