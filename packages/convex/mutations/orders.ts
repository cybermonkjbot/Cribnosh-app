import { v } from 'convex/values';
import { mutation, internalMutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { api } from '../_generated/api';
import { requireAuth, requireResourceAccess, isAdmin, isStaff } from '../utils/auth';

// Define types for cart items
type CartItem = {
  id: string;
  quantity: number;
  price: number;
  name: string;
  updatedAt?: number;
};

// Define cart document type
type CartDocument = {
  _id: Id<'carts'>;
  _creationTime: number;
  userId: Id<'users'>;
  items: CartItem[];
  updatedAt: number;
};

// Define OrderItem type to match the schema
type OrderItem = {
  dish_id: Id<'meals'>;
  quantity: number;
  price: number;
  name: string;
};

// Define OrderStatus and PaymentStatus types
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

// Create a new order
export const createOrder = mutation({
  args: {
    customer_id: v.string(),
    chef_id: v.string(),
    order_items: v.array(v.object({
      dish_id: v.string(),
      quantity: v.number(),
      price: v.number(),
      name: v.string(),
    })),
    total_amount: v.number(),
    payment_method: v.optional(v.string()),
    special_instructions: v.optional(v.string()),
    delivery_time: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Check regional availability if delivery address is provided
    if (args.delivery_address) {
      const { checkRegionAvailability } = await import('../queries/admin');
      const isRegionSupported = await checkRegionAvailability(ctx, {
        address: {
          city: args.delivery_address.city,
          country: args.delivery_address.country,
        },
      });
      
      if (!isRegionSupported) {
        throw new Error('Oops, We do not serve this region yet, Ordering is not available in your region');
      }
    }
    
    const now = Date.now();
    // Convert order items to the correct type
    const orderItems: OrderItem[] = args.order_items.map(item => ({
      dish_id: item.dish_id as Id<'meals'>,
      quantity: item.quantity,
      price: item.price,
      name: item.name
    }));

    const orderId = await ctx.db.insert('orders', {
      order_id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      customer_id: args.customer_id as Id<'users'>,
      chef_id: args.chef_id as Id<'chefs'>,
      order_date: new Date().toISOString(),
      total_amount: args.total_amount,
      order_status: 'pending',
      payment_status: 'pending',
      payment_method: args.payment_method,
      special_instructions: args.special_instructions,
      delivery_time: args.delivery_time,
      delivery_address: args.delivery_address,
      order_items: args.order_items.map(item => ({
        ...item,
        dish_id: item.dish_id as Id<'meals'>,
      })),
      createdAt: now,
      updatedAt: now,
    });

    return orderId;
  },
});

/**
 * Create order with validation - accepts dish IDs, validates meals in batch, and returns full order
 * This consolidates multiple roundtrips into a single mutation call
 */
export const createOrderWithValidation = mutation({
  args: {
    customer_id: v.string(),
    chef_id: v.string(),
    items: v.array(v.object({
      dish_id: v.string(),
      quantity: v.number(),
    })),
    payment_method: v.optional(v.string()),
    special_instructions: v.optional(v.string()),
    delivery_time: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx);
    
    // Ensure user can only create orders for themselves unless they're staff/admin
    if (!isAdmin(user) && !isStaff(user)) {
      if (args.customer_id !== user._id.toString()) {
        throw new Error('You can only create orders for yourself');
      }
    }
    
    // Check regional availability if delivery address is provided
    if (args.delivery_address) {
      const { checkRegionAvailability } = await import('../queries/admin');
      const isRegionSupported = await checkRegionAvailability(ctx, {
        address: {
          city: args.delivery_address.city,
          country: args.delivery_address.country,
        },
      });
      
      if (!isRegionSupported) {
        throw new Error('Oops, We do not serve this region yet, Ordering is not available in your region');
      }
    }
    
    // Validate all dishes in a single query
    const allMeals = await ctx.db.query('meals').collect();
    const mealMap = new Map<string, any>();
    for (const meal of allMeals) {
      mealMap.set(meal._id, meal);
    }
    
    // Validate each dish and build order items
    const orderItems: OrderItem[] = [];
    let total_amount = 0;
    
    for (const item of args.items) {
      if (!item.dish_id || typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error(`Invalid item: dish_id and quantity (must be > 0) are required`);
      }
      
      const dish = mealMap.get(item.dish_id as string);
      if (!dish) {
        throw new Error(`Dish not found: ${item.dish_id}`);
      }
      
      if (dish.status === 'unavailable') {
        throw new Error(`Dish ${dish.name || item.dish_id} is currently unavailable`);
      }
      
      const price = dish.price || 0;
      const quantity = item.quantity;
      
      orderItems.push({
        dish_id: item.dish_id as Id<'meals'>,
        quantity,
        price,
        name: dish.name || 'Unknown Dish',
      });
      
      total_amount += price * quantity;
    }
    
    if (orderItems.length === 0) {
      throw new Error('Order must contain at least one item');
    }
    
    // Create the order
    const now = Date.now();
    const orderId = await ctx.db.insert('orders', {
      order_id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      customer_id: args.customer_id as Id<'users'>,
      chef_id: args.chef_id as Id<'chefs'>,
      order_date: new Date().toISOString(),
      total_amount,
      order_status: 'pending',
      payment_status: 'pending',
      payment_method: args.payment_method,
      special_instructions: args.special_instructions,
      delivery_time: args.delivery_time,
      delivery_address: args.delivery_address,
      order_items: orderItems,
      createdAt: now,
      updatedAt: now,
    });
    
    // Return the full order
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error('Failed to retrieve created order');
    }
    
    return order;
  },
});

/**
 * Create order with payment - accepts payment_id upfront and returns full order
 * This consolidates order creation, payment linking, and order retrieval into a single mutation
 */
export const createOrderWithPayment = mutation({
  args: {
    customer_id: v.string(),
    chef_id: v.string(),
    order_items: v.array(v.object({
      dish_id: v.string(),
      quantity: v.number(),
      price: v.number(),
      name: v.string(),
    })),
    total_amount: v.number(),
    payment_id: v.string(),
    payment_method: v.optional(v.string()),
    special_instructions: v.optional(v.string()),
    delivery_time: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Check regional availability if delivery address is provided
    if (args.delivery_address) {
      const { checkRegionAvailability } = await import('../queries/admin');
      const isRegionSupported = await checkRegionAvailability(ctx, {
        address: {
          city: args.delivery_address.city,
          country: args.delivery_address.country,
        },
      });
      
      if (!isRegionSupported) {
        throw new Error('Oops, We do not serve this region yet, Ordering is not available in your region');
      }
    }
    
    const now = Date.now();
    // Convert order items to the correct type
    const orderItems: OrderItem[] = args.order_items.map(item => ({
      dish_id: item.dish_id as Id<'meals'>,
      quantity: item.quantity,
      price: item.price,
      name: item.name
    }));

    const orderId = await ctx.db.insert('orders', {
      order_id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      customer_id: args.customer_id as Id<'users'>,
      chef_id: args.chef_id as Id<'chefs'>,
      order_date: new Date().toISOString(),
      total_amount: args.total_amount,
      order_status: 'pending',
      payment_status: 'paid', // Mark as paid immediately since payment_id is provided
      payment_id: args.payment_id,
      payment_method: args.payment_method || 'card',
      special_instructions: args.special_instructions,
      delivery_time: args.delivery_time,
      delivery_address: args.delivery_address,
      order_items: orderItems,
      createdAt: now,
      updatedAt: now,
    });

    // Return the full order
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error('Failed to retrieve created order');
    }
    
    return order;
  },
});

// Internal mutation for seeding - skips region check
export const createOrderForSeed = internalMutation({
  args: {
    customer_id: v.id('users'),
    chef_id: v.id('chefs'),
    order_items: v.array(v.object({
      dish_id: v.id('meals'),
      quantity: v.number(),
      price: v.number(),
      name: v.string(),
    })),
    total_amount: v.number(),
    order_date: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.createdAt || Date.now();
    const orderId = await ctx.db.insert('orders', {
      order_id: `order_${now}_${Math.random().toString(36).substring(2, 10)}`,
      customer_id: args.customer_id,
      chef_id: args.chef_id,
      order_date: args.order_date || new Date(now).toISOString(),
      total_amount: args.total_amount,
      order_status: 'pending',
      payment_status: 'pending',
      order_items: args.order_items,
      createdAt: now,
      updatedAt: now,
    });

    return orderId;
  },
});

/**
 * Handle order completion - trigger profile updates
 */
async function handleOrderCompletion(ctx: any, orderId: Id<'orders'>, userId: Id<'users'>) {
  const order = await ctx.db.get(orderId);
  if (!order) return;

  // Create meal logs from order items
  const orderItems = (order.order_items || []).map((item: any) => ({
    mealId: item.dish_id,
    quantity: item.quantity,
  }));

  if (orderItems.length > 0) {
    await ctx.runMutation(api.mutations.mealLogs.bulkCreateMealLogs, {
      userId,
      orderId,
      orderItems,
      orderDate: order.order_date || new Date(order.createdAt).toISOString(),
    });
  }

  // Award Nosh Points (10 points per order)
  await ctx.runMutation(api.mutations.noshPoints.addPoints, {
    userId,
    points: 10,
    reason: 'Order completed',
    orderId,
  });

  // Update ForkPrint score (+10 points per order)
  await ctx.runMutation(api.mutations.forkPrint.updateScore, {
    userId,
    pointsDelta: 10,
  });
}

export const updateStatus = mutation({
  args: { 
    order_id: v.string(), 
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('preparing'),
      v.literal('ready'),
      v.literal('delivered'),
      v.literal('cancelled'),
      v.literal('completed')
    ) 
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.query('orders').filter(q => q.eq(q.field('order_id'), args.order_id)).first();
    if (!order) throw new Error('Order not found');
    
    const previousStatus = order.order_status;
    await ctx.db.patch(order._id, { 
      order_status: args.status,
      updatedAt: Date.now() 
    });

    // Handle order completion - trigger profile updates
    if ((args.status === 'delivered' || args.status === 'completed') && 
        previousStatus !== 'delivered' && previousStatus !== 'completed') {
      await handleOrderCompletion(ctx, order._id, order.customer_id);
    }

    return await ctx.db.get(order._id);
  },
});

export const markPaid = mutation({
  args: { order_id: v.string(), paymentIntentId: v.string() },
  handler: async (ctx, args) => {
    const order = await ctx.db.query('orders').filter(q => q.eq(q.field('order_id'), args.order_id)).first();
    if (!order) throw new Error('Order not found');
    await ctx.db.patch(order._id, { payment_status: 'paid', payment_id: args.paymentIntentId });
    return await ctx.db.get(order._id);
  },
});

export const markRefunded = mutation({
  args: { order_id: v.string(), refundId: v.string() },
  handler: async (ctx, args) => {
    // First try to find the order by order_id using a filter
    const orders = await ctx.db
      .query('orders')
      .filter((q) => q.eq(q.field('order_id'), args.order_id))
      .collect();
    
    const order = orders[0];
      
    if (!order) throw new Error('Order not found');
    
    await ctx.db.patch(order._id, {
      payment_status: 'refunded' as const,
      payment_id: args.refundId,
      updatedAt: Date.now(),
    });
  },
});

// Update order status from Stripe webhook
export const updateOrderStatus = mutation({
  args: {
    userId: v.id('users'),
    paymentIntentId: v.string(),
    status: v.union(
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('canceled')
    ),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the order by payment intent ID or user ID
    const orders = await ctx.db
      .query('orders')
      .filter((q) => q.eq(q.field('customer_id'), args.userId))
      .collect();
    
    // Find the most recent pending order for this user
    const pendingOrder = orders
      .filter(order => order.payment_status === 'pending')
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    
    if (!pendingOrder) {
      console.log(`No pending order found for user ${args.userId}`);
      return null;
    }
    
    // Update order status based on payment status
    let orderStatus: OrderStatus = 'pending';
    let paymentStatus: PaymentStatus = 'pending';
    
    switch (args.status) {
      case 'confirmed':
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
        break;
      case 'failed':
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
        break;
      case 'canceled':
        orderStatus = 'cancelled';
        paymentStatus = 'failed';
        break;
    }
    
    await ctx.db.patch(pendingOrder._id, {
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_id: args.paymentIntentId,
      updatedAt: Date.now(),
    });
    
    console.log(`Updated order ${pendingOrder._id} status to ${orderStatus}, payment to ${paymentStatus}`);
    return await ctx.db.get(pendingOrder._id);
  },
});

// Cart related mutations
export const updateCartItem = mutation({
  args: {
    userId: v.id('users'),
    itemId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    // Get the user's cart
    // Query the cart with proper type safety
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first() as CartDocument | null;

    if (!cart) {
      throw new Error('Cart not found');
    }

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Update the item quantity
    const updatedItems = (cart.items || []).map((item: CartItem) => 
      item.id === args.itemId 
        ? { ...item, quantity: args.quantity, updatedAt: Date.now() }
        : item
    );

    // Update the cart
    await ctx.db.patch(cart._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });

    return updatedItems.find(item => item.id === args.itemId);
  },
});

export const removeFromCart = mutation({
  args: {
    userId: v.id('users'),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the user's cart
    // Query the cart with proper type safety
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first() as CartDocument | null;

    if (!cart) {
      throw new Error('Cart not found');
    }

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Remove the item
    const updatedItems = cart.items.filter((item) => item.id !== args.itemId);

    // Update the cart
    await ctx.db.patch(cart._id, {
      items: updatedItems,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Clear cart (remove all items)
export const clearCart = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get the user's cart
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first() as CartDocument | null;

    if (!cart) {
      // Cart doesn't exist, nothing to clear
      return true;
    }

    // Clear all items from cart
    await ctx.db.patch(cart._id, {
      items: [],
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Add item to cart
export const addToCart = mutation({
  args: {
    userId: v.id('users'),
    dishId: v.id('meals'),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    // Fetch meal details
    const meal = await ctx.db.get(args.dishId);
    
    if (!meal) {
      throw new Error('Dish not found');
    }
    
    // Check if meal is available
    if (meal.status === 'unavailable') {
      throw new Error('This dish is currently unavailable');
    }
    
    // Validate quantity
    if (args.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    
    // Prepare cart item with meal details
    const cartItem: CartItem = {
      id: args.dishId,
      name: meal.name || 'Unknown Dish',
      price: meal.price || 0,
      quantity: args.quantity,
      updatedAt: Date.now(),
    };
    
    // Get or create the user's cart
    let cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first() as CartDocument | null;

    if (!cart) {
      // Create new cart if it doesn't exist
      const cartId = await ctx.db.insert('carts', {
        userId: args.userId,
        items: [cartItem],
        updatedAt: Date.now(),
      });
      cart = await ctx.db.get(cartId) as CartDocument;
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(item => item.id === args.dishId);
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...cart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + args.quantity,
          updatedAt: Date.now(),
        };
        
        await ctx.db.patch(cart._id, {
          items: updatedItems,
          updatedAt: Date.now(),
        });
      } else {
        // Add new item to cart
        const updatedItems = [...cart.items, cartItem];
        
        await ctx.db.patch(cart._id, {
          items: updatedItems,
          updatedAt: Date.now(),
        });
      }
    }

    return await ctx.db.get(cart._id);
  },
});

// Create order from live session
export const createOrderFromLiveSession = mutation({
  args: {
    sessionId: v.id('liveSessions'),
    userId: v.id('users'),
    orderData: v.object({
      items: v.array(v.object({
        dish_id: v.string(),
        quantity: v.number(),
        price: v.number(),
        name: v.string(),
      })),
      specialInstructions: v.optional(v.string()),
      deliveryAddress: v.optional(v.object({
        street: v.string(),
        city: v.string(),
        postcode: v.string(),
        country: v.string(),
      })),
      paymentMethod: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    try {
      // Get the live session
      const session = await ctx.db.get(args.sessionId);
      if (!session) {
        throw new Error('Live session not found');
      }
      
      // Get the chef from the session
      const chef = await ctx.db.get(session.chef_id);
      if (!chef) {
        throw new Error('Chef not found');
      }
      
      // Check regional availability if delivery address is provided
      if (args.orderData.deliveryAddress) {
        const { checkRegionAvailability } = await import('../queries/admin');
        const isRegionSupported = await checkRegionAvailability(ctx, {
          address: {
            city: args.orderData.deliveryAddress.city,
            country: args.orderData.deliveryAddress.country,
          },
        });
        
        if (!isRegionSupported) {
          throw new Error('Oops, We do not serve this region yet, Ordering is not available in your region');
        }
      }
      
      // Calculate total amount
      const totalAmount = args.orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create the order
      const orderId = await ctx.db.insert('orders', {
        order_id: `live_order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        customer_id: args.userId,
        chef_id: session.chef_id,
        order_date: new Date().toISOString(),
        total_amount: totalAmount,
        order_status: 'pending',
        payment_status: 'pending',
        payment_method: args.orderData.paymentMethod || 'card',
        special_instructions: args.orderData.specialInstructions,
        delivery_address: args.orderData.deliveryAddress,
        order_items: args.orderData.items.map(item => ({
          ...item,
          dish_id: item.dish_id as Id<'meals'>,
        })),
        live_session_id: args.sessionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      console.log(`Created order ${orderId} from live session ${args.sessionId} for user ${args.userId}`);
      
      return {
        orderId,
        totalAmount,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error creating order from live session:', error);
      throw error;
    }
  },
});

// Process refund for an order
export const processRefund = mutation({
  args: {
    orderId: v.id('orders'),
    refundId: v.string(),
    amount: v.number(),
    reason: v.union(
      v.literal('requested_by_customer'),
      v.literal('fraudulent'),
      v.literal('duplicate'),
      v.literal('other')
    ),
    processedBy: v.id('users'),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Update order with refund information
    await ctx.db.patch(args.orderId, {
      payment_status: 'refunded',
      refund_id: args.refundId,
      refund_amount: args.amount,
      refund_reason: args.reason,
      refund_processed_by: args.processedBy,
      refund_description: args.description,
      refund_metadata: args.metadata,
      refund_processed_at: Date.now(),
      updatedAt: Date.now(),
    });

    // Add refund to refund history
    await ctx.db.insert('refunds', {
      order_id: args.orderId,
      refund_id: args.refundId,
      amount: args.amount,
      reason: args.reason,
      processed_by: args.processedBy,
      description: args.description,
      metadata: args.metadata,
      processed_at: Date.now(),
      status: 'completed',
    });

    console.log(`Refund processed for order ${args.orderId}: ${args.amount} GBP`);
    return await ctx.db.get(args.orderId);
  },
});

// Cancel an order with reason
export const cancelOrder = mutation({
  args: {
    orderId: v.id('orders'),
    reason: v.union(
      v.literal('customer_request'),
      v.literal('out_of_stock'),
      v.literal('chef_unavailable'),
      v.literal('delivery_issue'),
      v.literal('fraudulent'),
      v.literal('duplicate'),
      v.literal('other')
    ),
    cancelledBy: v.id('users'),
    description: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Update order status
    await ctx.db.patch(args.orderId, {
      order_status: 'cancelled',
      cancellation_reason: args.reason,
      cancelled_by: args.cancelledBy,
      cancellation_description: args.description,
      cancellation_metadata: args.metadata,
      cancelled_at: Date.now(),
      updatedAt: Date.now(),
    });

    // Add cancellation to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'cancelled',
      reason: args.reason,
      performed_by: args.cancelledBy,
      description: args.description,
      metadata: args.metadata,
      performed_at: Date.now(),
    });

    console.log(`Order ${args.orderId} cancelled by ${args.cancelledBy}: ${args.reason}`);
    return await ctx.db.get(args.orderId);
  },
});

// Mark order as delivered
export const markOrderDelivered = mutation({
  args: {
    orderId: v.id('orders'),
    deliveredBy: v.id('users'),
    deliveryNotes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();
    const refundEligibleUntil = now + (24 * 60 * 60 * 1000); // 24 hours from now

    // Update order status
    await ctx.db.patch(args.orderId, {
      order_status: 'delivered',
      delivered_at: now,
      refund_eligible_until: refundEligibleUntil,
      is_refundable: true,
      updatedAt: now,
    });

    // Add delivery to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'delivered',
      performed_by: args.deliveredBy,
      description: args.deliveryNotes || 'Order delivered',
      metadata: {
        deliveryNotes: args.deliveryNotes,
        refundEligibleUntil: new Date(refundEligibleUntil).toISOString(),
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Order ${args.orderId} marked as delivered by ${args.deliveredBy}. Refund eligible until ${new Date(refundEligibleUntil).toISOString()}`);
    return await ctx.db.get(args.orderId);
  },
});

// Mark order as completed (after review)
export const markOrderCompleted = mutation({
  args: {
    orderId: v.id('orders'),
    completedBy: v.id('users'),
    completionNotes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Update order status
    await ctx.db.patch(args.orderId, {
      order_status: 'completed',
      completed_at: now,
      is_refundable: false, // No longer refundable once completed
      updatedAt: now,
    });

    // Add completion to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'completed',
      performed_by: args.completedBy,
      description: args.completionNotes || 'Order completed',
      metadata: {
        completionNotes: args.completionNotes,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Order ${args.orderId} marked as completed by ${args.completedBy}`);
    return await ctx.db.get(args.orderId);
  },
});

// Mark order as reviewed
export const markOrderReviewed = mutation({
  args: {
    orderId: v.id('orders'),
    reviewedBy: v.id('users'),
    reviewNotes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Update order status
    await ctx.db.patch(args.orderId, {
      reviewed_at: now,
      updatedAt: now,
    });

    // Add review to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'reviewed',
      performed_by: args.reviewedBy,
      description: args.reviewNotes || 'Order reviewed',
      metadata: {
        reviewNotes: args.reviewNotes,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Order ${args.orderId} marked as reviewed by ${args.reviewedBy}`);
    return await ctx.db.get(args.orderId);
  },
});

// Update refund eligibility based on time and status
export const updateRefundEligibility = mutation({
  args: {
    orderId: v.id('orders'),
    updatedBy: v.id('users'),
    reason: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();
    let isRefundable = order.is_refundable;
    let eligibilityReason = '';

    // Check if order is in non-refundable status
    if (['completed', 'cancelled'].includes(order.order_status)) {
      isRefundable = false;
      eligibilityReason = `Order status is ${order.order_status}`;
    }
    // Check if 24 hours have passed since delivery
    else if (order.delivered_at && order.refund_eligible_until && now > order.refund_eligible_until) {
      isRefundable = false;
      eligibilityReason = '24-hour refund window has expired';
    }
    // Check if order is still in refundable status
    else if (order.order_status === 'delivered' && order.refund_eligible_until && now <= order.refund_eligible_until) {
      isRefundable = true;
      eligibilityReason = 'Within 24-hour refund window';
    }
    // Orders not yet delivered are refundable
    else if (!['delivered', 'completed', 'cancelled'].includes(order.order_status)) {
      isRefundable = true;
      eligibilityReason = 'Order not yet delivered';
    }

    // Update refund eligibility
    await ctx.db.patch(args.orderId, {
      is_refundable: isRefundable,
      updatedAt: now,
    });

    // Add eligibility update to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'refund_eligibility_updated',
      performed_by: args.updatedBy,
      description: `${args.reason}: ${eligibilityReason}`,
      metadata: {
        isRefundable,
        eligibilityReason,
        reason: args.reason,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Order ${args.orderId} refund eligibility updated: ${isRefundable} - ${eligibilityReason}`);
    return await ctx.db.get(args.orderId);
  },
});

// Update refund window (admin function)
export const updateRefundWindow = mutation({
  args: {
    orderId: v.id('orders'),
    updatedBy: v.id('users'),
    newRefundEligibleUntil: v.number(),
    reason: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Update refund window
    await ctx.db.patch(args.orderId, {
      refund_eligible_until: args.newRefundEligibleUntil,
      is_refundable: args.newRefundEligibleUntil > now, // Set based on new window
      updatedAt: now,
    });

    // Add window update to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'refund_eligibility_updated',
      performed_by: args.updatedBy,
      description: `${args.reason}: Refund window updated to ${new Date(args.newRefundEligibleUntil).toISOString()}`,
      metadata: {
        newRefundEligibleUntil: args.newRefundEligibleUntil,
        originalRefundEligibleUntil: order.refund_eligible_until,
        isRefundable: args.newRefundEligibleUntil > now,
        reason: args.reason,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Order ${args.orderId} refund window updated by ${args.updatedBy}: ${new Date(args.newRefundEligibleUntil).toISOString()}`);
    return await ctx.db.get(args.orderId);
  },
});

// Confirm order (pending → confirmed)
export const confirmOrder = mutation({
  args: {
    orderId: v.id("orders"),
    confirmedBy: v.id("users"),
    estimatedReadyTime: v.optional(v.number()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.order_status !== 'pending') {
      throw new Error(`Order cannot be confirmed. Current status: ${order.order_status}`);
    }

    const now = Date.now();

    // Update order status
    await ctx.db.patch(args.orderId, {
      order_status: 'confirmed',
      estimated_prep_time_minutes: args.estimatedReadyTime,
      chef_notes: args.notes,
      updatedAt: now,
    });

    // Add to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'confirmed',
      performed_by: args.confirmedBy,
      description: 'Order confirmed by chef',
      metadata: args.metadata,
      performed_at: now,
    });

    console.log(`Order ${args.orderId} confirmed by ${args.confirmedBy}`);
    return await ctx.db.get(args.orderId);
  },
});

// Start preparing order (confirmed → preparing)
export const prepareOrder = mutation({
  args: {
    orderId: v.id('orders'),
    preparedBy: v.id('users'),
    prepNotes: v.optional(v.string()),
    updatedPrepTime: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Update order status
    await ctx.db.patch(args.orderId, {
      order_status: 'preparing',
      chef_notes: args.prepNotes || order.chef_notes,
      estimated_prep_time_minutes: args.updatedPrepTime || order.estimated_prep_time_minutes,
      updatedAt: now,
    });

    // Add preparation start to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'preparing',
      performed_by: args.preparedBy,
      description: 'Order preparation started',
      metadata: {
        prepNotes: args.prepNotes,
        updatedPrepTime: args.updatedPrepTime,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Order ${args.orderId} preparation started by ${args.preparedBy}`);
    return await ctx.db.get(args.orderId);
  },
});

// Mark order as ready (preparing → ready) - This triggers auto-assignment
export const markOrderReady = mutation({
  args: {
    orderId: v.id("orders"),
    readyBy: v.id("users"),
    readyNotes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.order_status !== 'preparing') {
      throw new Error(`Order cannot be marked as ready. Current status: ${order.order_status}`);
    }

    const now = Date.now();

    // Update order status
    await ctx.db.patch(args.orderId, {
      order_status: 'ready',
      chef_notes: args.readyNotes,
      updatedAt: now,
    });

    // Add to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'ready',
      performed_by: args.readyBy,
      description: 'Order marked as ready for delivery',
      metadata: args.metadata,
      performed_at: now,
    });

    // 🔥 AUTO-ASSIGN DRIVER BASED ON LOCATION
    try {
      await autoAssignDriverToOrder(ctx, args.orderId, order);
    } catch (error) {
      console.error(`Auto-assignment failed for order ${args.orderId}:`, error);
      // Don't fail the order status update if auto-assignment fails
    }

    console.log(`Order ${args.orderId} marked as ready by ${args.readyBy}`);
    return await ctx.db.get(args.orderId);
  },
});

// Update order details
export const updateOrder = mutation({
  args: {
    orderId: v.id('orders'),
    updatedBy: v.id('users'),
    deliveryAddress: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
    specialInstructions: v.optional(v.string()),
    deliveryTime: v.optional(v.string()),
    estimatedPrepTime: v.optional(v.number()),
    chefNotes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Prepare update object
    const updateData: any = {
      updatedAt: now,
    };

    if (args.deliveryAddress) {
      updateData.delivery_address = args.deliveryAddress;
    }
    if (args.specialInstructions !== undefined) {
      updateData.special_instructions = args.specialInstructions;
    }
    if (args.deliveryTime !== undefined) {
      updateData.delivery_time = args.deliveryTime;
    }
    if (args.estimatedPrepTime !== undefined) {
      updateData.estimated_prep_time_minutes = args.estimatedPrepTime;
    }
    if (args.chefNotes !== undefined) {
      updateData.chef_notes = args.chefNotes;
    }

    // Update order
    await ctx.db.patch(args.orderId, updateData);

    // Add update to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'updated',
      performed_by: args.updatedBy,
      description: 'Order details updated',
      metadata: {
        deliveryAddress: args.deliveryAddress,
        specialInstructions: args.specialInstructions,
        deliveryTime: args.deliveryTime,
        estimatedPrepTime: args.estimatedPrepTime,
        chefNotes: args.chefNotes,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Order ${args.orderId} updated by ${args.updatedBy}`);
    return await ctx.db.get(args.orderId);
  },
});

// Add note to order
export const addOrderNote = mutation({
  args: {
    orderId: v.id('orders'),
    addedBy: v.id('users'),
    note: v.string(),
    noteType: v.union(
      v.literal('chef_note'),
      v.literal('customer_note'),
      v.literal('internal_note')
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Add note to orderNotes table
    const noteId = await ctx.db.insert('orderNotes', {
      order_id: args.orderId,
      note: args.note,
      noteType: args.noteType,
      added_by: args.addedBy,
      metadata: args.metadata,
      added_at: now,
    });

    // Add note action to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'note_added',
      performed_by: args.addedBy,
      description: `Note added: ${args.noteType}`,
      metadata: {
        noteId,
        noteType: args.noteType,
        note: args.note,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Note added to order ${args.orderId} by ${args.addedBy}`);
    return await ctx.db.get(args.orderId);
  },
});

// Send order notification
export const sendOrderNotification = mutation({
  args: {
    orderId: v.id('orders'),
    sentBy: v.id('users'),
    notificationType: v.union(
      v.literal('order_confirmed'),
      v.literal('order_preparing'),
      v.literal('order_ready'),
      v.literal('order_delivered'),
      v.literal('order_completed'),
      v.literal('order_cancelled'),
      v.literal('order_updated'),
      v.literal('custom')
    ),
    message: v.string(),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    channels: v.array(v.union(
      v.literal('email'),
      v.literal('sms'),
      v.literal('push'),
      v.literal('in_app')
    )),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Add notification to orderNotifications table
    const notificationId = await ctx.db.insert('orderNotifications', {
      order_id: args.orderId,
      notification_type: args.notificationType,
      message: args.message,
      priority: args.priority,
      channels: args.channels,
      sent_by: args.sentBy,
      metadata: args.metadata,
      sent_at: now,
      status: 'sent',
    });

    // Add notification action to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'notification_sent',
      performed_by: args.sentBy,
      description: `Notification sent: ${args.notificationType}`,
      metadata: {
        notificationId,
        notificationType: args.notificationType,
        message: args.message,
        priority: args.priority,
        channels: args.channels,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Notification sent for order ${args.orderId} by ${args.sentBy}`);
    return await ctx.db.get(notificationId);
  },
});

// Send order message
export const sendOrderMessage = mutation({
  args: {
    orderId: v.id('orders'),
    sentBy: v.id('users'),
    message: v.string(),
    messageType: v.union(
      v.literal('text'),
      v.literal('image'),
      v.literal('file'),
      v.literal('status_update')
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const now = Date.now();

    // Add message to orderMessages table
    const messageId = await ctx.db.insert('orderMessages', {
      order_id: args.orderId,
      message: args.message,
      messageType: args.messageType,
      sent_by: args.sentBy,
      metadata: args.metadata,
      sent_at: now,
      status: 'sent',
    });

    // Add message action to order history
    await ctx.db.insert('orderHistory', {
      order_id: args.orderId,
      action: 'message_sent',
      performed_by: args.sentBy,
      description: `Message sent: ${args.messageType}`,
      metadata: {
        messageId,
        messageType: args.messageType,
        message: args.message,
        ...args.metadata
      },
      performed_at: now,
    });

    console.log(`Message sent for order ${args.orderId} by ${args.sentBy}`);
    return await ctx.db.get(messageId);
  },
});

// Helper function for automatic driver assignment
async function autoAssignDriverToOrder(ctx: any, orderId: Id<"orders">, order: any) {
  // Get delivery location from order
  const deliveryLocation = order.delivery_address;
  if (!deliveryLocation) {
    throw new Error('Order has no delivery address');
  }

  // Extract coordinates from delivery address
  let latitude = 0, longitude = 0;
  if (typeof deliveryLocation === 'string') {
    // Parse address string to get coordinates (you might want to use a geocoding service)
    // For now, we'll use default coordinates
  } else if (deliveryLocation.latitude && deliveryLocation.longitude) {
    latitude = deliveryLocation.latitude;
    longitude = deliveryLocation.longitude;
  } else {
    throw new Error('Invalid delivery location format');
  }

  // Get available drivers near the delivery location
  const availableDrivers = await ctx.db
    .query("drivers")
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .filter((q: any) => q.eq(q.field("availability"), "available"))
    .collect();

  if (availableDrivers.length === 0) {
    throw new Error('No available drivers found');
  }

  // Calculate distance and score each driver
  const scoredDrivers = availableDrivers.map((driver: any) => {
    if (!driver.currentLocation) {
      return { driver, score: 0, distance: Infinity };
    }

    const distance = calculateDistance(
      latitude, longitude,
      driver.currentLocation.latitude,
      driver.currentLocation.longitude
    );

    // Score based on distance (closer = higher score) and rating
    const distanceScore = Math.max(0, 100 - (distance * 10)); // 10 points per km
    const ratingScore = (driver.rating || 0) * 10; // 10 points per rating point
    const totalScore = distanceScore + ratingScore;

    return { driver, score: totalScore, distance };
  });

  // Sort by score (highest first) and select the best driver
  scoredDrivers.sort((a: any, b: any) => b.score - a.score);
  const bestDriver = scoredDrivers[0];

  if (bestDriver.score === 0) {
    throw new Error('No suitable drivers found');
  }

  // Create delivery assignment
  const assignmentId = await ctx.db.insert('deliveryAssignments', {
    order_id: orderId,
    driver_id: bestDriver.driver._id,
    assigned_by: order.ready_by || order.confirmed_by,
    assigned_at: Date.now(),
    estimated_pickup_time: order.ready_at,
    estimated_delivery_time: order.ready_at + (30 * 60 * 1000), // 30 minutes from ready time
    pickup_location: {
      latitude: 0, // Will be updated with actual chef location
      longitude: 0,
      address: typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address),
      instructions: "Pick up from chef location",
    },
    delivery_location: {
      latitude,
      longitude,
      address: typeof order.delivery_address === 'string' ? order.delivery_address : JSON.stringify(order.delivery_address),
      instructions: order.delivery_instructions || "Deliver to customer",
    },
    status: 'assigned',
    metadata: {
      autoAssigned: true,
      assignmentScore: bestDriver.score,
      distanceKm: bestDriver.distance,
      driverRating: bestDriver.driver.rating,
    },
  });

  // Update driver availability
  await ctx.db.patch(bestDriver.driver._id, {
    availability: 'busy',
    updatedAt: Date.now(),
  });

  console.log(`Auto-assigned driver ${bestDriver.driver._id} to order ${orderId} (score: ${bestDriver.score}, distance: ${bestDriver.distance.toFixed(2)}km)`);
  return assignmentId;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}