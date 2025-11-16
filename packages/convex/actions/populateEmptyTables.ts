"use node";

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Populate empty tables with relevant data for a specific user
 * and ensure the user has orders with all possible order statuses
 */
export const populateEmptyTablesForUser = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`Starting to populate empty tables for user: ${args.email}`);

    // 1. Find the user
    const user = await ctx.runQuery(api.queries.users.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      throw new Error(`User with email ${args.email} not found`);
    }

    console.log(`Found user: ${user._id} (${user.name})`);

    // 2. Get user's existing orders and check statuses
    const existingOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
      customer_id: user._id.toString(),
      status: "all",
      order_type: "all",
    });

    const existingStatuses = new Set(
      existingOrders.map((order: any) => order.order_status || order.status)
    );

    const allStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled",
      "completed",
    ];

    const missingStatuses = allStatuses.filter(
      (status) => !existingStatuses.has(status)
    );

    console.log(`Existing order statuses: ${Array.from(existingStatuses).join(", ")}`);
    console.log(`Missing order statuses: ${missingStatuses.join(", ")}`);

    // 3. Get a chef and meal to create orders
    const allChefs = await ctx.runQuery(api.queries.chefs.getAll, {});
    if (allChefs.length === 0) {
      throw new Error("No chefs found. Cannot create orders.");
    }
    const chef = allChefs[0];

    // Get meals for this chef - use getAll and filter
    const allMeals = await ctx.runQuery(api.queries.meals.getAll, {});
    const chefMeals = allMeals.filter((m: any) => m.chefId === chef._id || m.chef_id === chef._id);
    if (chefMeals.length === 0) {
      throw new Error("No meals found. Cannot create orders.");
    }
    const meal = chefMeals[0];

    // 4. Get all user orders directly from database and update/create orders with missing statuses
    // First, try to update existing orders to cover missing statuses
    const allUserOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
      customer_id: user._id.toString(),
      status: "all",
    });
    
    const createdOrders: string[] = [];
    let orderIndex = 0;
    
    // Update existing orders first
    for (const status of missingStatuses) {
      if (orderIndex < allUserOrders.length) {
        try {
          const order = allUserOrders[orderIndex];
          await ctx.runMutation(api.mutations.orders.updateStatus, {
            order_id: order.order_id || order._id.toString(),
            status: status as any,
          });
          createdOrders.push(order.order_id || order._id.toString());
          console.log(`Updated existing order to status: ${status}`);
          orderIndex++;
        } catch (error: any) {
          console.error(`Failed to update order to status ${status}:`, error?.message || error);
        }
      } else {
        // Create new orders for remaining statuses
        try {
          const orderId = await ctx.runMutation(internal.mutations.orders.createOrderForSeed, {
            customer_id: user._id,
            chef_id: chef._id,
            order_items: [
              {
                dish_id: meal._id,
                quantity: 1,
                price: meal.price || 1299,
                name: meal.name || "Sample Meal",
              },
            ],
            total_amount: meal.price || 1299,
            createdAt: Date.now() - Math.random() * 86400000,
          });

          // Get the order to update its status
          const updatedOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
            customer_id: user._id.toString(),
            status: "all",
          });
          const newOrder = updatedOrders.find((o: any) => o._id === orderId);
          
          if (newOrder) {
            await ctx.runMutation(api.mutations.orders.updateStatus, {
              order_id: newOrder.order_id,
              status: status as any,
            });
            createdOrders.push(newOrder.order_id);
            console.log(`Created order with status: ${status}`);
          }
        } catch (error: any) {
          console.error(`Failed to create order with status ${status}:`, error?.message || error);
        }
      }
    }

    // 5. Populate empty tables using direct database operations via internal mutations
    // We'll create simple internal mutations to insert data directly

    // Create notifications for user
    try {
      await ctx.runMutation(api.mutations.notifications.create, {
        userId: user._id,
        type: "order_confirmed",
        message: "Your order has been confirmed!",
        global: false,
        createdAt: Date.now(),
      });
      console.log("Created notification for user");
    } catch (error) {
      console.error("Failed to create notification:", error);
    }

    return {
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      orders: {
        existing: existingOrders.length,
        existingStatuses: Array.from(existingStatuses),
        created: createdOrders.length,
        createdOrderIds: createdOrders,
        missingStatuses: missingStatuses,
      },
    };
  },
});
