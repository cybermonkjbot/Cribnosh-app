// @ts-nocheck - Convex action type instantiation depth issues
"use node";

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { GoogleMapsService } from "../utils/googleMaps";

import { action } from "../_generated/server";

export const dispatchOrder = action({
    args: {
        orderId: v.id("orders"),
        isDelayedRun: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const order = await ctx.runQuery(api.queries.orders.getById, { order_id: args.orderId });
        if (!order) {
            console.error(`Dispatch failed: Order ${args.orderId} not found`);
            return;
        }

        // Fetch chef early to get pickup location
        const chef = await ctx.runQuery(api.queries.chefs.getById, { chefId: order.chef_id });
        if (!chef) {
            console.error(`Dispatch failed: Chef ${order.chef_id} not found`);
            return;
        }

        const settings = await ctx.runQuery(api.queries.admin.getSystemSettings);
        const fallbackEnabled = settings?.fallback_enabled ?? false;

        // Get configured max range (default 10km)
        const driverMaxRange = settings?.driver_max_range ?? 10;

        // Get Google Maps API Key
        const googleMapsKey = settings?.google_maps_api_key;
        const googleMapsService = googleMapsKey ? new GoogleMapsService(googleMapsKey) : null;

        // Check for Predictive Dispatch
        const enablePredictiveDispatch = settings?.enable_predictive_dispatch ?? false;
        const predictiveBufferMins = settings?.predictive_buffer_minutes ?? 15;

        // If enabled and this is NOT a delayed run (initial trigger), check if we should wait
        if (enablePredictiveDispatch && !args.isDelayedRun) {
            // Find max prep time from order items
            let maxPrepTimeMins = 0;
            // Fetch meals to check prep times
            const mealIds = order.order_items.map((item: any) => item.dish_id);
            for (const mealId of mealIds) {
                const meal = await ctx.runQuery(api.queries.meals.getById, { mealId });
                if (meal?.prepTime) {
                    const mins = parsePrepTime(meal.prepTime);
                    if (mins > maxPrepTimeMins) maxPrepTimeMins = mins;
                }
            }

            // Only apply predictive logic if prep time is significant (> buffer)
            if (maxPrepTimeMins > predictiveBufferMins) {
                // Determine target dispatch time: Order Created + Prep Time - Buffer
                // This aims to dispatch a driver so they arrive just as food is ready (minus buffer)
                const createdTime = order.createdAt;
                const bufferMs = predictiveBufferMins * 60 * 1000;
                const prepTimeMs = maxPrepTimeMins * 60 * 1000;

                const targetDispatchTime = createdTime + prepTimeMs - bufferMs;
                const now = Date.now();

                if (targetDispatchTime > now) {
                    const delayMs = targetDispatchTime - now;
                    console.log(`Predictive Dispatch: Delaying order ${args.orderId} by ${Math.round(delayMs / 60000)} mins (Prep: ${maxPrepTimeMins}m, Buffer: ${predictiveBufferMins}m)`);

                    await ctx.scheduler.runAfter(delayMs, api.actions.delivery.dispatchOrder, {
                        orderId: args.orderId,
                        isDelayedRun: true
                    });

                    // Update order metadata or logs if needed to show "Scheduled" status
                    return;
                }
            }
        }

        // 1. Try to find an internal driver
        const drivers = await ctx.runQuery(api.queries.drivers.getAll, {});

        // Check for Batching
        const enableBatching = settings?.enable_batching ?? false;

        // Filter radius slightly larger (2x) for Haversine check to minimize Google API calls
        const FILTER_RADIUS_KM = driverMaxRange * 2;
        const [chefLng, chefLat] = chef.location.coordinates;

        // First pass: Candidates logic
        // If batching is enabled, we also consider 'on_delivery' drivers
        const candidateDrivers: any[] = [];

        for (const d of drivers) {
            // Must be active
            if (d.status !== 'active') continue;
            if (!d.currentLocation) continue;

            let isBatchedCandidate = false;

            // Batching Logic: Check if driver is eligible for stacking
            if (enableBatching && d.availability === 'on_delivery') {
                // Find their current active assignment
                const currentAssignment = await ctx.runQuery(api.queries.delivery.getDriverActiveAssignment, { driverId: d._id as any });

                // If they are at the SAME pickup location (Kitchen/Chef) and haven't left yet
                // Status must be assigned, accepted, or picked_up (if we allow stacking after pickup? maybe strict to before 'in_transit')
                // Let's iterate: strict batching = only if they are still at pickup
                if (currentAssignment &&
                    (currentAssignment.status === 'assigned' || currentAssignment.status === 'accepted' || currentAssignment.status === 'picked_up') &&
                    (currentAssignment.pickup_location.latitude === chefLat && currentAssignment.pickup_location.longitude === chefLng)) {

                    // They are a perfect candidate!
                    d.isBatched = true;
                    d.haversineDistance = 0; // Prioritize
                    d.googleDistance = 0;
                    candidateDrivers.push(d);
                    isBatchedCandidate = true;
                    console.log(`Batching: Driver ${d._id} is a candidate for stacking (at same pickup)`);
                }
            }

            // Standard logic for available drivers
            if (!isBatchedCandidate && d.availability === 'available') {
                const dist = calculateDistance(
                    chefLat, chefLng,
                    d.currentLocation.latitude, d.currentLocation.longitude
                );

                if (dist <= FILTER_RADIUS_KM) {
                    d.haversineDistance = dist;
                    candidateDrivers.push(d);
                }
            }
        }

        // Second pass: Precise Google Maps check (if key available) OR STRICT HAVERSINE
        // We skip Google Checks for already-batched drivers (distance is effectively 0)
        let validDrivers: any[] = [];
        const driversToValidate = candidateDrivers.filter(d => !d.isBatched);
        const batchedDrivers = candidateDrivers.filter(d => d.isBatched);

        // Add batched drivers directly to valid list
        validDrivers = [...batchedDrivers];

        if (googleMapsService && driversToValidate.length > 0) {
            console.log(`Validating ${driversToValidate.length} candidate drivers with Google Maps...`);

            for (const driver of driversToValidate) {
                const route = await googleMapsService.calculateRouteDistance(
                    { lat: chefLat, lng: chefLng },
                    { lat: driver.currentLocation.latitude, lng: driver.currentLocation.longitude }
                );

                if (route && route.distanceKm <= driverMaxRange) {
                    driver.googleDistance = route.distanceKm;
                    driver.googleDuration = route.durationMins;
                    validDrivers.push(driver);
                }
            }
        } else if (driversToValidate.length > 0) {
            // Fallback to strict Haversine check if no Google Key
            const haversineValid = driversToValidate.filter((d: any) => d.haversineDistance <= driverMaxRange);
            validDrivers = [...validDrivers, ...haversineValid];
        }

        if (validDrivers.length > 0) {
            // Sort by distance (Google distance preferred, then Haversine)
            validDrivers.sort((a: any, b: any) => {
                // Batched drivers always come first (0 distance)
                const distA = a.googleDistance ?? a.haversineDistance;
                const distB = b.googleDistance ?? b.haversineDistance;
                return distA - distB;
            });

            // Assign to the nearest available driver
            const driver = validDrivers[0];
            const distance = driver.googleDistance ?? driver.haversineDistance;

            await ctx.runMutation(api.mutations.delivery.assignDelivery, {
                orderId: order._id,
                driverId: driver._id,
                assignedBy: order.chef_id as any, // assigned by system/chef?
                metadata: {
                    auto_dispatched: true,
                    dispatch_distance_km: distance,
                    dispatch_source: driver.googleDistance ? 'google_maps' : 'haversine'
                }
            });
            console.log(`Order ${args.orderId} dispatched to internal driver ${driver._id} (Distance: ${distance.toFixed(2)}km)`);
            return;
        }

        // 2. If no internal drivers and fallback enabled -> Call Stuart
        if (fallbackEnabled) {
            console.log(`No internal drivers available within ${driverMaxRange}km. Attempting Stuart fallback for order ${args.orderId}`);

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
            const customerPhone = customer?.phone_number || order.delivery_address?.phone || ""; // Fallback to order phone if available

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

/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
