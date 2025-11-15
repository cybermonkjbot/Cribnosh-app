"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

/**
 * Complete order from cart flow that handles:
 * - Creating order with payment
 * - Recording family spending (if applicable)
 * - Clearing cart
 * - Returning full order details
 * 
 * This consolidates multiple roundtrips into a single action call
 */
export const createOrderFromCartComplete = action({
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
    // Family order metadata (optional)
    family_profile_id: v.optional(v.string()),
    member_user_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Step 1: Create order with payment
    const order = await ctx.runMutation(api.mutations.orders.createOrderWithPayment, {
      customer_id: args.customer_id,
      chef_id: args.chef_id,
      order_items: args.order_items,
      total_amount: args.total_amount,
      payment_id: args.payment_id,
      payment_method: args.payment_method,
      special_instructions: args.special_instructions,
      delivery_time: args.delivery_time,
      delivery_address: args.delivery_address,
    });

    // Step 2: Record family spending if this is a family order
    if (args.family_profile_id && args.member_user_id) {
      try {
        await ctx.runMutation(api.mutations.familyProfiles.recordOrderSpending, {
          family_profile_id: args.family_profile_id as Id<'familyProfiles'>,
          member_user_id: args.member_user_id as Id<'users'>,
          order_amount: args.total_amount,
          currency: 'gbp',
        });
      } catch (error) {
        console.warn('Could not record family member spending:', error);
        // Continue - order is created, budget tracking can be retried
      }
    }

    // Step 3: Clear cart after order creation
    try {
      await ctx.runMutation(api.mutations.orders.clearCart, {
        userId: args.customer_id as Id<'users'>,
      });
    } catch (error) {
      console.warn('Could not clear cart after order creation:', error);
      // Continue - order is created, cart clearing can be retried
    }

    // Step 4: Return full order (already returned from createOrderWithPayment)
    return order;
  },
});

/**
 * Customer Get Orders - for mobile app direct Convex communication
 */
export const customerGetOrders = action({
  args: {
    sessionToken: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    sort_by: v.optional(v.string()),
    sort_order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    status: v.optional(v.union(v.literal("ongoing"), v.literal("past"), v.literal("all"))),
    order_type: v.optional(v.union(v.literal("individual"), v.literal("group"), v.literal("all"))),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      orders: v.array(v.any()),
      total: v.number(),
      limit: v.number(),
      offset: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Calculate pagination
      const limit = args.limit || 20;
      const offset = args.page ? (args.page - 1) * limit : 0;

      // Get orders from Convex
      const orders = await ctx.runQuery(api.queries.orders.listByCustomer, {
        customer_id: user._id.toString(),
        status: args.status || 'all',
        order_type: args.order_type || 'all',
        limit,
        offset,
        sessionToken: args.sessionToken,
      });

      // Get total count (without pagination)
      const allOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
        customer_id: user._id.toString(),
        status: args.status || 'all',
        order_type: args.order_type || 'all',
        sessionToken: args.sessionToken,
      });

      // Transform and enrich orders with meal images
      const transformedOrders = await Promise.all(orders.map(async (order: any) => {
        // Enrich order items with images
        const enrichedOrderItems = await Promise.all(
          (order.order_items || []).map(async (item: any) => {
            try {
              // Get meal ID - try multiple possible field names
              const mealId = item.dish_id || item.dishId || item.id || item._id;
              if (!mealId) {
                return item; // Return item as-is if no meal ID found
              }

              // Get meal details to fetch image
              const meal = await ctx.runQuery(api.queries.meals.getById, {
                mealId: mealId as any,
              });

              // Get all image URLs if available
              const imageUrls: string[] = [];
              if (meal?.images && Array.isArray(meal.images) && meal.images.length > 0) {
                for (const image of meal.images) {
                  let imageUrl: string | undefined = undefined;
                  // Check if it's a Convex storage ID (starts with 'k' and is a valid ID format)
                  // or if it's already a URL
                  if (image.startsWith('http://') || image.startsWith('https://')) {
                    imageUrl = image;
                  } else if (image.startsWith('k')) {
                    // It's likely a Convex storage ID, get the URL
                    try {
                      imageUrl = await ctx.storage.getUrl(image as any);
                    } catch (error) {
                      console.error('Failed to get storage URL for image:', image, error);
                      // Fallback to relative path
                      imageUrl = `/api/files/${image}`;
                    }
                  } else {
                    // Fallback to relative path
                    imageUrl = `/api/files/${image}`;
                  }
                  if (imageUrl) {
                    imageUrls.push(imageUrl);
                  }
                }
              }

              return {
                ...item,
                image_url: imageUrls.length > 0 ? imageUrls[0] : undefined, // Keep first image for backward compatibility
                image_urls: imageUrls, // Array of all images
                imageUrl: imageUrls.length > 0 ? imageUrls[0] : undefined,
                imageUrls: imageUrls,
                images: imageUrls,
              };
            } catch (error) {
              // If meal not found or error, return item without image
              console.error('Error enriching order item:', error);
              return item;
            }
          })
        );

        return {
          ...order,
          order_status: order.order_status,
          is_group_order: order.is_group_order || false,
          group_order: order.group_order_details || null,
          order_items: enrichedOrderItems,
        };
      }));

      return {
        success: true as const,
        orders: transformedOrders,
        total: allOrders.length,
        limit,
        offset,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get orders';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Order - for mobile app direct Convex communication
 */
export const customerGetOrder = action({
  args: {
    sessionToken: v.string(),
    order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      order: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Get order from Convex
      const order = await ctx.runQuery(api.queries.orders.getById, {
        order_id: args.order_id,
        sessionToken: args.sessionToken,
      });

      if (!order) {
        return { success: false as const, error: 'Order not found' };
      }

      // Verify ownership
      if (order.customer_id !== user._id && order.customer_id.toString() !== user._id.toString()) {
        return { success: false as const, error: 'Order not found or not owned by customer' };
      }

      // Transform to standardized format
      const orderData = {
        id: order._id,
        customerId: order.customer_id,
        chefId: order.chef_id,
        orderDate: new Date(order.order_date || order.createdAt || Date.now()).toISOString(),
        totalAmount: order.total_amount,
        orderStatus: order.order_status,
        specialInstructions: order.special_instructions || null,
        estimatedPrepTimeMinutes: order.estimated_prep_time_minutes || null,
        chefNotes: order.chef_notes || null,
        paymentStatus: order.payment_status,
        orderItems: order.order_items || [],
      };

      return {
        success: true as const,
        order: orderData,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Order Status - for mobile app direct Convex communication
 */
export const customerGetOrderStatus = action({
  args: {
    sessionToken: v.string(),
    order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      order: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get order from Convex (status endpoint doesn't require customer role check)
      const order = await ctx.runQuery(api.queries.orders.getById, {
        order_id: args.order_id,
        sessionToken: args.sessionToken,
      });

      if (!order) {
        return { success: false as const, error: 'Order not found' };
      }

      return {
        success: true as const,
        order: order,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get order status';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Order - for mobile app direct Convex communication
 */
export const customerCreateOrder = action({
  args: {
    sessionToken: v.string(),
    chef_id: v.string(),
    order_items: v.array(v.object({
      dish_id: v.string(),
      quantity: v.number(),
    })),
    special_instructions: v.optional(v.string()),
    delivery_time: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
      coordinates: v.optional(v.array(v.number())),
    })),
    payment_method: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      order: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Validate inputs
      if (!args.chef_id || !args.order_items || args.order_items.length === 0) {
        return { success: false as const, error: 'chef_id and order_items are required' };
      }

      // Check regional availability if delivery address is provided
      if (args.delivery_address) {
        try {
          const isRegionSupported = await ctx.runQuery(api.queries.admin.checkRegionAvailability, {
            address: {
              city: args.delivery_address.city,
              country: args.delivery_address.country,
              coordinates: args.delivery_address.coordinates || [],
            },
            sessionToken: args.sessionToken,
          });

          if (!isRegionSupported) {
            return {
              success: false as const,
              error: 'Oops, We do not serve this region yet, Ordering is not available in your region',
            };
          }
        } catch (error) {
          // Region check failed, continue anyway
          console.warn('Region availability check failed:', error);
        }
      }

      // Get all meals to validate and calculate prices
      const allMeals = await ctx.runQuery(api.queries.meals.getAll, {});

      const mealMap = new Map<string, any>();
      for (const meal of allMeals as any[]) {
        mealMap.set(meal._id, meal);
      }

      // Validate items and calculate total
      const orderItems = [];
      let totalAmount = 0;

      for (const item of args.order_items) {
        if (!item.dish_id || typeof item.quantity !== 'number' || item.quantity <= 0) {
          return { success: false as const, error: 'Each order item must have dish_id and quantity > 0' };
        }

        const meal = mealMap.get(item.dish_id);
        if (!meal) {
          return { success: false as const, error: `Dish not found: ${item.dish_id}` };
        }

        const price = meal.price || 0;
        const quantity = item.quantity;
        totalAmount += price * quantity;

        orderItems.push({
          dish_id: item.dish_id,
          quantity,
          price,
          name: meal.name || 'Unknown Dish',
        });
      }

      // Create order using mutation
      const order = await ctx.runMutation(api.mutations.orders.createOrderWithValidation, {
        customer_id: user._id.toString(),
        chef_id: args.chef_id,
        items: args.order_items,
        payment_method: args.payment_method,
        special_instructions: args.special_instructions,
        delivery_time: args.delivery_time,
        delivery_address: args.delivery_address,
        sessionToken: args.sessionToken,
      });

      return {
        success: true as const,
        order: order,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Order From Cart - for mobile app direct Convex communication
 * Note: This assumes payment has already been processed (payment_intent_id provided)
 */
export const customerCreateOrderFromCart = action({
  args: {
    sessionToken: v.string(),
    payment_intent_id: v.string(),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
      coordinates: v.optional(v.array(v.number())),
    })),
    special_instructions: v.optional(v.string()),
    delivery_time: v.optional(v.string()),
    nosh_points_applied: v.optional(v.number()), // Nosh Points applied for discount
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      order_id: v.string(),
      order: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      if (!args.payment_intent_id) {
        return { success: false as const, error: 'payment_intent_id is required' };
      }

      // Note: Payment intent verification should be done server-side
      // For now, we'll trust the payment_intent_id and proceed
      // In production, you'd verify with Stripe here

      // Check regional availability if delivery address is provided
      if (args.delivery_address) {
        try {
          const isRegionSupported = await ctx.runQuery(api.queries.admin.checkRegionAvailability, {
            address: {
              city: args.delivery_address.city,
              country: args.delivery_address.country,
              coordinates: args.delivery_address.coordinates || [],
            },
            sessionToken: args.sessionToken,
          });

          if (!isRegionSupported) {
            return {
              success: false as const,
              error: 'Oops, We do not serve this region yet, Ordering is not available in your region',
            };
          }
        } catch (error) {
          console.warn('Region availability check failed:', error);
        }
      }

      // Get user's cart
      const cart = await ctx.runQuery(api.queries.orders.getUserCart, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        return { success: false as const, error: 'Cart is empty. Cannot create order.' };
      }

      // Get all meals to map cart items to meals and extract chef_id
      const allMeals = await ctx.runQuery(api.queries.meals.getAll, {});

      // Group cart items by chef
      const itemsByChef = new Map<string, Array<{
        dish_id: string;
        quantity: number;
        price: number;
        name: string;
      }>>();

      let totalAmount = 0;

      for (const cartItem of cart.items) {
        const meal = (allMeals as any[]).find((m: any) => m._id === cartItem.id || m._id === cartItem.dish_id);

        if (!meal) {
          return { success: false as const, error: `Meal not found: ${cartItem.id}` };
        }

        const chefId = meal.chefId || meal.chef_id;
        if (!chefId) {
          return { success: false as const, error: `Meal ${cartItem.id} does not have a chef_id.` };
        }

        const chefIdStr = chefId.toString();
        if (!itemsByChef.has(chefIdStr)) {
          itemsByChef.set(chefIdStr, []);
        }

        const itemPrice = meal.price || cartItem.price || 0;
        const itemQuantity = cartItem.quantity;
        const itemTotal = itemPrice * itemQuantity;
        totalAmount += itemTotal;

        itemsByChef.get(chefIdStr)!.push({
          dish_id: cartItem.id,
          quantity: itemQuantity,
          price: itemPrice,
          name: cartItem.name || meal.name || 'Unknown Item',
        });
      }

      if (itemsByChef.size === 0) {
        return { success: false as const, error: 'No valid chef_id found in cart items.' };
      }

      // Create separate orders for each chef
      const createdOrders = [];
      let firstOrder = null;

      for (const [chefId, orderItems] of itemsByChef.entries()) {
        // Calculate total for this chef's items
        const chefTotal = orderItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);

        // Calculate proportional points for this chef's order
        // If multiple chefs, distribute points proportionally
        const totalCartValue = Array.from(itemsByChef.values()).reduce(
          (sum, items) => sum + items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0),
          0
        );
        const chefProportion = chefTotal / totalCartValue;
        const chefPointsApplied = args.nosh_points_applied 
          ? Math.floor(args.nosh_points_applied * chefProportion)
          : undefined;

        // Create order with payment for this chef
        const order = await ctx.runMutation(api.mutations.orders.createOrderWithPayment, {
          customer_id: user._id.toString(),
          chef_id: chefId,
          order_items: orderItems,
          total_amount: chefTotal,
          payment_id: args.payment_intent_id, // Same payment intent for all orders
          payment_method: 'card',
          special_instructions: args.special_instructions,
          delivery_time: args.delivery_time,
          delivery_address: args.delivery_address,
          sessionToken: args.sessionToken,
          nosh_points_applied: chefPointsApplied,
        });

        createdOrders.push(order);
        if (!firstOrder) {
          firstOrder = order;
        }
      }

      // Clear cart after all orders are created
      try {
        await ctx.runMutation(api.mutations.orders.clearCart, {
          userId: user._id,
        });
      } catch (error) {
        console.warn('Could not clear cart after order creation:', error);
        // Continue - orders are created
      }

      // Return the first order for backward compatibility
      // In the future, we could return all orders
      if (!firstOrder) {
        return { success: false as const, error: 'Failed to create orders' };
      }

      return {
        success: true as const,
        order_id: firstOrder.order_id || firstOrder._id,
        order: firstOrder,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create order from cart';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Cancel Order - for mobile app direct Convex communication
 */
export const customerCancelOrder = action({
  args: {
    sessionToken: v.string(),
    order_id: v.string(),
    reason: v.optional(v.string()),
    refund_preference: v.optional(v.union(v.literal("full_refund"), v.literal("partial_refund"), v.literal("credit"))),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      order_id: v.string(),
      status: v.string(),
      refund_status: v.string(),
      cancelled_at: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Get order and verify ownership
      const order = await ctx.runQuery(api.queries.orders.getById, {
        order_id: args.order_id,
        sessionToken: args.sessionToken,
      });

      if (!order) {
        return { success: false as const, error: 'Order not found' };
      }

      if (order.customer_id !== user._id && order.customer_id.toString() !== user._id.toString()) {
        return { success: false as const, error: 'Order not found' };
      }

      // Check if order can be cancelled
      const orderStatus = order.order_status;
      if (['delivered', 'cancelled', 'completed'].includes(orderStatus)) {
        return {
          success: false as const,
          error: 'Order cannot be cancelled. Order is already delivered, cancelled, or completed.',
        };
      }

      // Cancel the order
      await ctx.runMutation(api.mutations.orders.updateStatus, {
        order_id: args.order_id,
        status: 'cancelled',
      });

      // Note: Refund processing would typically be done server-side with Stripe
      // For now, we'll just mark the order as cancelled
      // In production, you'd process refunds here based on refund_preference

      return {
        success: true as const,
        order_id: args.order_id,
        status: 'cancellation_pending',
        refund_status: 'pending',
        cancelled_at: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to cancel order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Rate Order - for mobile app direct Convex communication
 */
export const customerRateOrder = action({
  args: {
    sessionToken: v.string(),
    order_id: v.string(),
    rating: v.number(),
    review: v.optional(v.string()),
    categories: v.optional(v.object({
      food_quality: v.optional(v.number()),
      delivery_speed: v.optional(v.number()),
      packaging: v.optional(v.number()),
      customer_service: v.optional(v.number()),
    })),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      review_id: v.string(),
      order_id: v.string(),
      rating: v.number(),
      review: v.optional(v.string()),
      created_at: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Validate rating
      if (!args.rating || typeof args.rating !== 'number' || args.rating < 1 || args.rating > 5) {
        return { success: false as const, error: 'rating is required and must be a number between 1 and 5' };
      }

      // Validate categories if provided
      if (args.categories) {
        const validCategoryKeys = ['food_quality', 'delivery_speed', 'packaging', 'customer_service'];
        for (const [key, value] of Object.entries(args.categories)) {
          if (!validCategoryKeys.includes(key)) {
            return { success: false as const, error: `Invalid category: ${key}` };
          }
          if (value !== undefined && (typeof value !== 'number' || value < 1 || value > 5)) {
            return { success: false as const, error: `Category rating ${key} must be a number between 1 and 5` };
          }
        }
      }

      // Get order and verify ownership
      const order = await ctx.runQuery(api.queries.orders.getById, {
        order_id: args.order_id,
        sessionToken: args.sessionToken,
      });

      if (!order) {
        return { success: false as const, error: 'Order not found' };
      }

      if (order.customer_id !== user._id && order.customer_id.toString() !== user._id.toString()) {
        return { success: false as const, error: 'Order not found' };
      }

      // Check if order can be rated
      const orderStatus = order.order_status;
      if (orderStatus !== 'delivered' && orderStatus !== 'completed') {
        return {
          success: false as const,
          error: 'Order cannot be rated. Order must be delivered or completed.',
        };
      }

      // Check if order is already rated
      const allReviews = await ctx.runQuery(api.queries.reviews.getAll, {});
      const existingReview = (allReviews as any[]).find(
        (r: any) => r.order_id === order._id && r.user_id === user._id
      );

      if (existingReview) {
        return { success: false as const, error: 'Order has already been rated' };
      }

      // Create review
      const reviewResult = await ctx.runMutation(api.mutations.reviews.createReviewWithChefRatingUpdate, {
        user_id: user._id,
        meal_id: undefined,
        chef_id: order.chef_id,
        order_id: order._id,
        rating: args.rating,
        comment: args.review || undefined,
        categories: args.categories || undefined,
        status: 'approved',
        createdAt: Date.now(),
      });

      return {
        success: true as const,
        review_id: reviewResult.reviewId || reviewResult._id || '',
        order_id: args.order_id,
        rating: args.rating,
        review: args.review || undefined,
        created_at: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to submit rating';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Recent Dishes - for mobile app direct Convex communication
 */
export const customerGetRecentDishes = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      dishes: v.array(v.any()),
      total: v.number(),
      limit: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const limit = args.limit || 10;

      // Get customer's past orders
      const orders = await ctx.runQuery(api.queries.orders.listByCustomer, {
        customer_id: user._id.toString(),
        status: 'past',
        order_type: 'all',
        sessionToken: args.sessionToken,
      });

      // Extract unique dishes from orders
      const dishMap = new Map<string, any>();
      const dishOrderMap = new Map<string, Array<{ order: any; item: any }>>();

      for (const order of orders) {
        if (!order.order_items || !Array.isArray(order.order_items)) continue;

        for (const item of order.order_items) {
          const dishId = item.dish_id || item.dishId;
          if (!dishId) continue;

          if (!dishOrderMap.has(dishId)) {
            dishOrderMap.set(dishId, []);
          }
          dishOrderMap.get(dishId)!.push({ order, item });
        }
      }

      // Get all dish details in batch
      const dishIds = Array.from(dishOrderMap.keys()) as any[];
      const dishesWithDetails = dishIds.length > 0
        ? await ctx.runQuery(api.queries.meals.getDishesWithDetails, {
            dishIds,
          })
        : [];

      // Create dish details map
      const dishDetailsMap = new Map<string, any>();
      for (const dish of dishesWithDetails as any[]) {
        dishDetailsMap.set(dish._id, dish);
      }

      // Process orders and build dish map
      for (const [dishId, orderItems] of dishOrderMap.entries()) {
        const dishDetails = dishDetailsMap.get(dishId);
        if (!dishDetails) continue;

        const firstItem = orderItems[0];
        const lastOrder = orderItems.reduce((latest, current) => {
          const currentTime = current.order._creationTime || current.order.createdAt || Date.now();
          const latestTime = latest.order._creationTime || latest.order.createdAt || Date.now();
          return currentTime > latestTime ? current : latest;
        }, firstItem);

        dishMap.set(dishId, {
          dish_id: dishId,
          name: firstItem.item.name || dishDetails.name || 'Unknown Dish',
          price: firstItem.item.price || dishDetails.price || 0,
          image_url: dishDetails.images?.[0] ? `/api/files/${dishDetails.images[0]}` : undefined,
          kitchen_name: dishDetails.chef?.name || 'Unknown Kitchen',
          kitchen_id: dishDetails.chefId,
          last_ordered_at: lastOrder.order._creationTime || lastOrder.order.createdAt || Date.now(),
          order_count: orderItems.length,
          has_bussin_badge: (dishDetails.averageRating || 0) >= 4.5,
        });
      }

      // Convert to array and sort by last_ordered_at
      const dishes = Array.from(dishMap.values())
        .sort((a, b) => b.last_ordered_at - a.last_ordered_at)
        .slice(0, limit);

      return {
        success: true as const,
        dishes,
        total: dishMap.size,
        limit,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get recent dishes';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Usual Dinner Items - for mobile app direct Convex communication
 */
export const customerGetUsualDinnerItems = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    time_range: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("all"))),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      items: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const limit = args.limit || 6;
      const timeRange = args.time_range || 'all';

      // Calculate time range filter
      const now = Date.now();
      let timeRangeStart = 0;
      if (timeRange === 'week') {
        timeRangeStart = now - 7 * 24 * 60 * 60 * 1000;
      } else if (timeRange === 'month') {
        timeRangeStart = now - 30 * 24 * 60 * 60 * 1000;
      }

      // Get all orders for the user
      const allOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
        customer_id: user._id.toString(),
        status: 'all',
        order_type: 'all',
        sessionToken: args.sessionToken,
      });

      // Filter orders by time range if specified
      let filteredOrders = allOrders;
      if (timeRange !== 'all') {
        filteredOrders = allOrders.filter((order: any) => {
          const orderDate = order.order_date || order.createdAt || order._creationTime;
          return orderDate && orderDate >= timeRangeStart;
        });
      }

      // Aggregate dinner items (orders between 5 PM - 10 PM, delivered status)
      const dinnerItemsMap = new Map<string, any>();

      for (const order of filteredOrders) {
        // Check if order is delivered
        if (order.order_status !== 'delivered') continue;

        // Get order date and check if it's dinner time (5 PM - 10 PM)
        const orderDate = order.order_date || order.createdAt || order._creationTime;
        const date = new Date(orderDate);
        const hour = date.getHours();

        if (hour < 17 || hour >= 22) continue;

        // Process order items
        if (order.order_items && Array.isArray(order.order_items)) {
          for (const item of order.order_items) {
            const dishId = item.dish_id || item.mealId || item.meal_id;
            if (!dishId) continue;

            const existing = dinnerItemsMap.get(dishId);
            if (existing) {
              existing.order_count += item.quantity || 1;
              if (orderDate > existing.last_ordered_at) {
                existing.last_ordered_at = orderDate;
              }
            } else {
              // Get meal details
              let meal: any = null;
              try {
                meal = await ctx.runQuery(api.queries.meals.getById, {
                  mealId: dishId as any,
                });
              } catch {
                continue;
              }

              if (!meal) continue;

              // Get chef/kitchen details
              let chef: any = null;
              if (meal.chefId) {
                try {
                  chef = await ctx.runQuery(api.queries.chefs.getById, {
                    chefId: meal.chefId as any,
                  });
                } catch {
                  // Chef not found
                }
              }

              // Get reviews for average rating
              const allReviews = await ctx.runQuery(api.queries.reviews.getAll, {});
              const mealReviews = (allReviews as any[]).filter(
                (r: any) => r.mealId === dishId || r.meal_id === dishId
              );
              const ratings = mealReviews.map((r: any) => r.rating || 0).filter((r: number) => r > 0);

              dinnerItemsMap.set(dishId, {
                dish_id: dishId,
                name: item.name || meal.name || 'Unknown Dish',
                price: item.price || meal.price || 0,
                image_url: meal.images?.[0] ? `/api/files/${meal.images[0]}` : undefined,
                kitchen_name: chef?.name || order.chef_name || 'Unknown Kitchen',
                kitchen_id: meal.chefId || order.chef_id || '',
                order_count: item.quantity || 1,
                last_ordered_at: orderDate,
                ratings,
              });
            }
          }
        }
      }

      // Convert to array and calculate average ratings
      const items = Array.from(dinnerItemsMap.values()).map((item) => ({
        ...item,
        avg_rating:
          item.ratings && item.ratings.length > 0
            ? item.ratings.reduce((sum: number, r: number) => sum + r, 0) / item.ratings.length
            : undefined,
        ratings: undefined, // Remove ratings array from response
      }));

      // Sort by order count descending, then by last ordered date
      items.sort((a, b) => {
        if (b.order_count !== a.order_count) {
          return b.order_count - a.order_count;
        }
        return b.last_ordered_at - a.last_ordered_at;
      });

      // Limit results
      const limitedItems = items.slice(0, limit);

      return {
        success: true as const,
        items: limitedItems,
        total: items.length,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get usual dinner items';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Custom Order - for mobile app direct Convex communication
 */
export const customerCreateCustomOrder = action({
  args: {
    sessionToken: v.string(),
    requirements: v.string(),
    serving_size: v.number(),
    desired_delivery_time: v.string(),
    budget: v.optional(v.number()),
    dietary_restrictions: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      custom_order: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Generate custom order ID
      const customOrderId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create custom order
      const orderId_db = await ctx.runMutation(api.mutations.customOrders.createCustomOrder, {
        userId: user._id,
        requirements: args.requirements,
        servingSize: args.serving_size,
        desiredDeliveryTime: args.desired_delivery_time,
        dietaryRestrictions: args.dietary_restrictions || null,
        customOrderId,
        orderId,
      });

      // Get the created order
      const customOrder = await ctx.runQuery(api.queries.custom_orders.getById, {
        customOrderId: orderId_db,
      });

      if (!customOrder) {
        return { success: false as const, error: 'Failed to create custom order' };
      }

      return {
        success: true as const,
        custom_order: {
          _id: customOrder._id,
          custom_order_id: customOrder.custom_order_id,
          requirements: customOrder.requirements,
          serving_size: customOrder.serving_size,
          desired_delivery_time: customOrder.desired_delivery_time,
          dietary_restrictions: customOrder.dietary_restrictions,
          status: customOrder.status,
          estimated_price: customOrder.estimatedPrice,
          created_at: customOrder.createdAt,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create custom order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Custom Orders - for mobile app direct Convex communication
 */
export const customerGetCustomOrders = action({
  args: {
    sessionToken: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      custom_orders: v.array(v.any()),
      total: v.number(),
      page: v.number(),
      limit: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Get custom orders for user
      const allOrders = await ctx.runQuery(api.queries.custom_orders.getByUserId, {
        userId: user._id,
      });

      // Apply pagination
      const page = args.page || 1;
      const limit = args.limit || 10;
      const offset = (page - 1) * limit;
      const paginatedOrders = allOrders.slice(offset, offset + limit);

      // Transform orders to match expected format
      const formattedOrders = paginatedOrders.map((order: any) => ({
        _id: order._id,
        custom_order_id: order.custom_order_id,
        requirements: order.requirements,
        serving_size: order.serving_size,
        desired_delivery_time: order.desired_delivery_time,
        dietary_restrictions: order.dietary_restrictions,
        status: order.status,
        estimated_price: order.estimatedPrice,
        created_at: order.createdAt,
        updated_at: order.updatedAt || order.createdAt,
      }));

      return {
        success: true as const,
        custom_orders: formattedOrders,
        total: allOrders.length,
        page,
        limit,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get custom orders';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Custom Order - for mobile app direct Convex communication
 */
export const customerGetCustomOrder = action({
  args: {
    sessionToken: v.string(),
    custom_order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      custom_order: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Get custom order
      const order = await ctx.runQuery(api.queries.custom_orders.getById, {
        customOrderId: args.custom_order_id,
      });

      if (!order) {
        return { success: false as const, error: 'Custom order not found' };
      }

      // Verify ownership
      if (order.userId !== user._id && order.userId.toString() !== user._id.toString()) {
        return { success: false as const, error: 'Custom order not found or not owned by customer' };
      }

      // Transform to match expected format
      const formattedOrder = {
        _id: order._id,
        custom_order_id: order.custom_order_id,
        requirements: order.requirements,
        serving_size: order.serving_size,
        desired_delivery_time: order.desired_delivery_time,
        dietary_restrictions: order.dietary_restrictions,
        status: order.status,
        estimated_price: order.estimatedPrice,
        created_at: order.createdAt,
        updated_at: order.updatedAt || order.createdAt,
      };

      return {
        success: true as const,
        custom_order: formattedOrder,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get custom order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Custom Order - for mobile app direct Convex communication
 */
export const customerUpdateCustomOrder = action({
  args: {
    sessionToken: v.string(),
    custom_order_id: v.string(),
    requirements: v.optional(v.string()),
    serving_size: v.optional(v.number()),
    desired_delivery_time: v.optional(v.string()),
    dietary_restrictions: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      custom_order: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Get custom order to verify ownership
      const order = await ctx.runQuery(api.queries.custom_orders.getById, {
        customOrderId: args.custom_order_id,
      });

      if (!order) {
        return { success: false as const, error: 'Custom order not found' };
      }

      // Verify ownership
      if (order.userId !== user._id && order.userId.toString() !== user._id.toString()) {
        return { success: false as const, error: 'Custom order not found or not owned by customer' };
      }

      // Build updates object
      const updates: any = {};
      if (args.requirements !== undefined) updates.requirements = args.requirements;
      if (args.serving_size !== undefined) updates.servingSize = args.serving_size;
      if (args.desired_delivery_time !== undefined) updates.desiredDeliveryTime = args.desired_delivery_time;
      if (args.dietary_restrictions !== undefined) updates.dietaryRestrictions = args.dietary_restrictions;

      // Update custom order
      const updatedOrder = await ctx.runMutation(api.mutations.customOrders.update, {
        orderId: order._id,
        updates,
      });

      if (!updatedOrder) {
        return { success: false as const, error: 'Failed to update custom order' };
      }

      // Transform to match expected format
      const formattedOrder = {
        _id: updatedOrder._id,
        custom_order_id: updatedOrder.custom_order_id,
        requirements: updatedOrder.requirements,
        serving_size: updatedOrder.serving_size,
        desired_delivery_time: updatedOrder.desired_delivery_time,
        dietary_restrictions: updatedOrder.dietary_restrictions,
        status: updatedOrder.status,
        estimated_price: updatedOrder.estimatedPrice,
        created_at: updatedOrder.createdAt,
        updated_at: updatedOrder.updatedAt || updatedOrder.createdAt,
      };

      return {
        success: true as const,
        custom_order: formattedOrder,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update custom order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Generate Shared Order Link - for mobile app direct Convex communication
 */
export const customerGenerateSharedOrderLink = action({
  args: {
    sessionToken: v.string(),
    order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      shareLink: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Verify order exists and belongs to user
      const order = await ctx.runQuery(api.queries.custom_orders.getById, {
        customOrderId: args.order_id,
      });

      if (!order) {
        return { success: false as const, error: 'Order not found' };
      }

      if (order.userId !== user._id && order.userId.toString() !== user._id.toString()) {
        return { success: false as const, error: 'Order not found' };
      }

      // Generate share link
      const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://cribnosh.com';
      const shareLink = `${baseUrl}/orders/shared/${order.custom_order_id || order._id}`;

      return {
        success: true as const,
        shareLink,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to generate share link';
      return { success: false as const, error: errorMessage };
    }
  },
});

