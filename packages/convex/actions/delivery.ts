// @ts-nocheck - Convex action type instantiation depth issues
"use node";

import { v } from "convex/values";
import { api, internal } from "../_generated/api";

import { action } from "../_generated/server";

export const dispatchOrder = action({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        const order = await ctx.runQuery(api.queries.orders.getById, { order_id: args.orderId });
        if (!order) {
            console.error(`Dispatch failed: Order ${args.orderId} not found`);
            return;
        }

        const settings = await ctx.runQuery(api.queries.admin.getDeliverySettings);
        const fallbackEnabled = settings?.fallback_enabled ?? false;

        // 1. Try to find an internal driver
        // This query needs to be implemented or we reuse existing availability logic
        // For now mocking the availability check as "no drivers available" if we want to test fallback,
        // or we can invoke a query that checks drivers.

        // Let's assume we check for available drivers in the same zone
        // If we had a query: api.queries.drivers.getAvailableDrivers(location)

        // Simplified logic: Check if ANY driver is 'available'
        const drivers = await ctx.runQuery(api.queries.drivers.getAll, {});
        const availableDrivers = drivers.filter((d: any) => d.availability === 'available' && d.status === 'active');

        if (availableDrivers.length > 0) {
            // Assign to the first available driver (or use more complex logic)
            // We trigger the internal assignment mutation
            const driver = availableDrivers[0];
            await ctx.runMutation(api.mutations.delivery.assignDelivery, {
                orderId: order._id,
                driverId: driver._id,
                assignedBy: order.chef_id as any, // assigned by system/chef?
                metadata: { auto_dispatched: true }
            });
            console.log(`Order ${args.orderId} dispatched to internal driver ${driver._id}`);
            return;
        }

        // 2. If no internal drivers and fallback enabled -> Call Stuart
        if (fallbackEnabled) {
            console.log(`No internal drivers available. Attempting Stuart fallback for order ${args.orderId}`);

            // Fetch necessary data for Stuart
            const chef = await ctx.runQuery(api.queries.chefs.getById, { chefId: order.chef_id });
            if (!chef) {
                console.error(`Dispatch failed: Chef ${order.chef_id} not found`);
                return;
            }

            const chefUser = await ctx.runQuery(api.queries.users.getById, { userId: chef.userId });
            if (!chefUser) {
                console.error(`Dispatch failed: Chef User ${chef.userId} not found`);
                return;
            }

            // Find the chef's kitchen for pickup address
            // getKitchenDetails accepts either kitchenId or chefsId (union)
            const kitchen = await ctx.runQuery(api.queries.kitchens.getKitchenDetails, { kitchenId: chef._id as any });

            // Fallback for pickup address
            const pickupAddress = kitchen?.address ||
                chef.onboardingDraft?.kitchenAddress ||
                chef.onboardingDraft?.city ||
                chef.location.city;

            if (!pickupAddress) {
                console.error(`Dispatch failed: No pickup address found for chef ${chef._id}`);
                return;
            }

            const customer = await ctx.runQuery(api.queries.users.getById, { userId: order.customer_id });
            const customerPhone = customer?.phone_number || order.delivery_address?.phone || ""; // Fallback to order phone if available (schema check needed)
            // Note: Schema for order.delivery_address doesn't have phone, so relying on user profile or hardcode fallback if missing

            const deliveryAddress = typeof order.delivery_address === 'string' ? order.delivery_address :
                `${order.delivery_address?.street}, ${order.delivery_address?.city}, ${order.delivery_address?.postcode}`;

            try {
                // Calculate optimal package size based on order
                const packageSize = await ctx.runAction(internal.stuart_integration.calculatePackageSize, {
                    orderId: order._id,
                });

                // Get Quote for logging
                const quote = await ctx.runAction(internal.stuart_integration.getJobQuote, {
                    pickup: pickupAddress,
                    dropoff: deliveryAddress,
                    package_type: packageSize,
                });
                if (quote) {
                    console.log(`Stuart Quote for order ${args.orderId}: ${quote.amount} ${quote.currency}`);
                }

                const job = await ctx.runAction(internal.stuart_integration.createJob, {
                    pickup: {
                        address: pickupAddress,
                        contact: {
                            firstname: chefUser.name,
                            phone: chefUser.phone_number || "+447000000000" // Fallback if no phone
                        }
                    },
                    dropoff: {
                        address: deliveryAddress,
                        package_type: packageSize, // Dynamic package size
                        contact: {
                            firstname: customer?.name || "Customer",
                            phone: customerPhone || "+447000000000" // Fallback if no phone
                        },
                        client_reference: order.order_id
                    }
                });

                // Extract tracking URL from Stuart response
                const trackingUrl = job.deliveries?.[0]?.tracking_url;

                // Create Delivery Assignment with Stuart details
                await ctx.runMutation(api.mutations.delivery.assignExternalDelivery, {
                    orderId: order._id,
                    provider: 'stuart',
                    externalId: String(job.id),
                    externalStatus: job.status,
                    externalTrackingUrl: trackingUrl,
                    estimated_pickup_time: job.deliveries?.[0]?.pickup_at ? new Date(job.deliveries[0].pickup_at).getTime() : undefined,
                    estimated_delivery_time: job.deliveries?.[0]?.dropoff_at ? new Date(job.deliveries[0].dropoff_at).getTime() : undefined,
                    pickupLocation: {
                        address: pickupAddress,
                    },
                    deliveryLocation: {
                        address: deliveryAddress,
                    },
                    metadata: {
                        job_response: job,
                        fallback: true,
                        package_size: packageSize,
                    }
                });

                // Store tracking URL in order for customer access
                if (trackingUrl) {
                    await ctx.runMutation(api.mutations.orders.updateOrder, {
                        orderId: order._id,
                        updates: {
                            stuart_tracking_url: trackingUrl,
                            stuart_job_id: String(job.id),
                        } as any,
                    });
                }

                console.log(`Stuart job ${job.id} created and assigned for order ${order._id} (package: ${packageSize})`);


            } catch (e) {
                console.error(`Stuart dispatch failed for order ${args.orderId}`, e);
            }
        } else {
            console.warn(`No drivers available and fallback disabled for order ${args.orderId}`);
        }
    }
});
