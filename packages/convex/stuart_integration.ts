// @ts-nocheck
"use node";

import { v } from "convex/values";
import { api } from "./_generated/api";
import { internalAction } from "./_generated/server";

const STUART_SANDBOX_API = "https://api.sandbox.stuart.com";
const STUART_PROD_API = "https://api.stuart.com";

interface StuartSettings {
    stuart_api_key?: string;
    stuart_env?: string;
    fallback_enabled?: boolean;
    [key: string]: any;
}

interface StuartJobResponse {
    id: number;
    status: string;
    pickup_at?: string;
    dropoff_at?: string;
    deliveries?: Array<{
        tracking_url?: string;
        pickup_at?: string;
        dropoff_at?: string;
        package_delivered_picture_url?: string;
        signature_url?: string;
        comment?: string;
        dropoff_eta_seconds?: number;
    }>;
    driver?: {
        display_name?: string;
        firstname?: string;
        phone?: string;
        picture_path_imgix?: string;
        latitude?: number;
        longitude?: number;
        transport_type?: string;
    };
    pricing?: any;
    [key: string]: any;
}

export const createJob = internalAction({
    args: {
        pickup: v.object({
            address: v.string(),
            contact: v.object({
                firstname: v.optional(v.string()),
                lastname: v.optional(v.string()),
                phone: v.optional(v.string()),
                company: v.optional(v.string()),
            }),
        }),
        dropoff: v.object({
            address: v.string(),
            contact: v.object({
                firstname: v.optional(v.string()),
                lastname: v.optional(v.string()),
                phone: v.optional(v.string()),
                company: v.optional(v.string()),
            }),
            package_type: v.string(), // xsmall, small, medium, large, xlarge
            client_reference: v.optional(v.string()),
        }),
    },
    handler: async (ctx, args): Promise<StuartJobResponse> => {
        // 1. Get Settings
        const settings = await ctx.runQuery(api.queries.admin.getDeliverySettings) as unknown as StuartSettings;

        if (!settings || !settings.stuart_api_key) {
            throw new Error("Stuart API key not configured");
        }

        const env = settings.stuart_env || "sandbox";
        const baseUrl = env === "production" ? STUART_PROD_API : STUART_SANDBOX_API;

        // 2. Validate Token
        if (!settings.stuart_api_key) {
            throw new Error("Missing Stuart API Key");
        }

        // 3. Construct Payload
        const payload = {
            job: {
                pickup_at: new Date().toISOString(), // Immediate pickup
                pickups: [
                    {
                        address: args.pickup.address,
                        contact: args.pickup.contact,
                    },
                ],
                dropoffs: [
                    {
                        address: args.dropoff.address,
                        package_type: args.dropoff.package_type,
                        contact: args.dropoff.contact,
                        client_reference: args.dropoff.client_reference,
                    },
                ],
            },
        };

        // 4. Call API
        try {
            const response = await fetch(`${baseUrl}/v2/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${settings.stuart_api_key}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Stuart API Error:", errorText);
                throw new Error(`Stuart API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = (await response.json()) as StuartJobResponse;
            return data;
        } catch (error) {
            console.error("Failed to create Stuart job:", error);
            throw error;
        }
    },
});

export const validateAddress = internalAction({
    args: {
        address: v.string(),
        type: v.union(v.literal("picking"), v.literal("delivering")),
    },
    handler: async (ctx, args): Promise<{ valid: boolean; error?: string; data?: any }> => {
        // 1. Get Settings
        const settings = await ctx.runQuery(api.queries.admin.getDeliverySettings) as unknown as StuartSettings;

        if (!settings || !settings.stuart_api_key) {
            throw new Error("Stuart API key not configured");
        }

        const env = settings.stuart_env || "sandbox";
        const baseUrl = env === "production" ? STUART_PROD_API : STUART_SANDBOX_API;

        const url = new URL(`${baseUrl}/v2/addresses/validate`);
        url.searchParams.append("address", args.address);
        url.searchParams.append("type", args.type);

        try {
            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${settings.stuart_api_key}`,
                },
            });

            if (!response.ok) {
                return { valid: false, error: await response.text() };
            }

            const data = (await response.json()) as { success: boolean;[key: string]: any };
            return { valid: data.success, data };
        } catch (error) {
            console.error("Address validation failed:", error);
            // Don't block flow on validation error, just log it
            return { valid: false, error: String(error) };
        }
    }
});

export const getJobQuote = internalAction({
    args: {
        pickup: v.string(),
        dropoff: v.string(),
        package_type: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const settings = await ctx.runQuery(api.queries.admin.getDeliverySettings) as unknown as StuartSettings;
        if (!settings || !settings.stuart_api_key) return null;

        const env = settings.stuart_env || "sandbox";
        const baseUrl = env === "production" ? STUART_PROD_API : STUART_SANDBOX_API;

        const payload = {
            job: {
                pickup_at: new Date().toISOString(),
                pickups: [{ address: args.pickup }],
                dropoffs: [{ address: args.dropoff, package_type: args.package_type }],
            },
        };

        try {
            const response = await fetch(`${baseUrl}/v2/jobs/pricing`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${settings.stuart_api_key}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Stuart Quote Error:", error);
            return null;
        }
    },
});

export const cancelJob = internalAction({
    args: {
        jobId: v.string(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
        const settings = await ctx.runQuery(api.queries.admin.getDeliverySettings) as unknown as StuartSettings;
        if (!settings || !settings.stuart_api_key) return { success: false, error: "No API Key" };

        const env = settings.stuart_env || "sandbox";
        const baseUrl = env === "production" ? STUART_PROD_API : STUART_SANDBOX_API;

        try {
            const response = await fetch(`${baseUrl}/v2/jobs/${args.jobId}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${settings.stuart_api_key}`,
                },
                body: JSON.stringify({
                    reason_key: args.reason || "job_cancelled", // 'job_cancelled' is a safe default if no reason provided
                    comment: "Cancelled by Cribnosh system"
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                // If 409 or 404, it might already be cancelled or too late
                console.error("Stuart Cancel Error:", error);
                return { success: false, error };
            }

            return { success: true };
        } catch (error) {
            console.error("Stuart Cancel Exception:", error);
            return { success: false, error: String(error) };
        }
    },
});

/**
 * Get real-time ETA for a Stuart job
 * Returns ETA in seconds to either pickup or dropoff location
 */
export const getJobETA = internalAction({
    args: {
        jobId: v.string(),
        type: v.union(v.literal("pickup"), v.literal("dropoff")),
    },
    handler: async (ctx, args): Promise<{ eta_seconds: number; type: "pickup" | "dropoff"; timestamp: number } | null> => {
        const settings = await ctx.runQuery(api.queries.admin.getDeliverySettings) as unknown as StuartSettings;
        if (!settings || !settings.stuart_api_key) return null;

        const env = settings.stuart_env || "sandbox";
        const baseUrl = env === "production" ? STUART_PROD_API : STUART_SANDBOX_API;

        const endpoint = args.type === "pickup"
            ? `${baseUrl}/v2/jobs/${args.jobId}/eta_to_pickup`
            : `${baseUrl}/v2/jobs/${args.jobId}/eta_to_dropoff`;

        try {
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${settings.stuart_api_key}`,
                },
            });

            if (!response.ok) {
                console.error(`Stuart ETA Error (${args.type}):`, await response.text());
                return null;
            }

            const data = (await response.json()) as { eta: number };
            // Stuart returns ETA in seconds
            return {
                eta_seconds: data.eta,
                type: args.type,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error("Stuart ETA Exception:", error);
            return null;
        }
    },
});

/**
 * Get full job details including courier location, status, and tracking info
 */
export const getJobDetails = internalAction({
    args: {
        jobId: v.string(),
    },
    handler: async (ctx, args): Promise<StuartJobResponse | null> => {
        const settings = await ctx.runQuery(api.queries.admin.getDeliverySettings) as unknown as StuartSettings;
        if (!settings || !settings.stuart_api_key) return null;

        const env = settings.stuart_env || "sandbox";
        const baseUrl = env === "production" ? STUART_PROD_API : STUART_SANDBOX_API;

        try {
            const response = await fetch(`${baseUrl}/v2/jobs/${args.jobId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${settings.stuart_api_key}`,
                },
            });

            if (!response.ok) {
                console.error("Stuart Job Details Error:", await response.text());
                return null;
            }

            const data = (await response.json()) as any;

            // Extract relevant information
            return {
                id: data.id,
                status: data.status,
                courier: data.driver ? {
                    name: data.driver.display_name || data.driver.firstname,
                    phone: data.driver.phone,
                    photo: data.driver.picture_path_imgix,
                    latitude: data.driver.latitude,
                    longitude: data.driver.longitude,
                    transport_type: data.driver.transport_type,
                } : null,
                tracking_url: data.deliveries?.[0]?.tracking_url,
                pickup_at: data.pickup_at,
                dropoff_eta: data.deliveries?.[0]?.dropoff_eta_seconds,
                proof_of_delivery: data.deliveries?.[0]?.package_delivered_picture_url ? {
                    photo: data.deliveries[0].package_delivered_picture_url,
                    signature: data.deliveries[0].signature_url,
                    comment: data.deliveries[0].comment,
                } : null,
                pricing: data.pricing,
            };
        } catch (error) {
            console.error("Stuart Job Details Exception:", error);
            return null;
        }
    },
});

/**
 * Calculate optimal package size based on food order details
 * Considers meal portions, serving counts, and special packaging needs
 */
export const calculatePackageSize = internalAction({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        try {
            const order = await ctx.runQuery(api.queries.orders.getById, { order_id: args.orderId });
            if (!order) return "medium"; // Default fallback

            const items = order.items || [];
            if (items.length === 0) return "small";

            let totalServings = 0;
            let totalWeight = 0;
            let requiresSpecialPackaging = false;
            let hasLargeItems = false;
            let hasFamilyPortions = false;

            // Fetch meal details for each item
            for (const item of items) {
                const mealId = item.dish_id || item.meal_id;
                if (!mealId) continue;

                const meal = await ctx.runQuery(api.queries.meals.getById, { mealId });
                if (!meal) continue;

                const quantity = item.quantity || 1;

                // Calculate servings
                if (meal.servingCount) {
                    totalServings += meal.servingCount * quantity;
                } else if (meal.portionSize) {
                    // Estimate servings based on portion size
                    const servingEstimates: Record<string, number> = {
                        small: 0.5,
                        regular: 1,
                        large: 1.5,
                        family: 3,
                    };
                    const servingEstimate = servingEstimates[meal.portionSize] || 1;
                    totalServings += servingEstimate * quantity;
                } else {
                    // Default to 1 serving per item
                    totalServings += quantity;
                }

                // Calculate weight
                if (meal.packageWeight) {
                    totalWeight += meal.packageWeight * quantity;
                }

                // Check for special packaging needs
                if (meal.requiresSpecialPackaging) {
                    requiresSpecialPackaging = true;
                }

                // Check portion sizes
                if (meal.portionSize === "large") {
                    hasLargeItems = true;
                } else if (meal.portionSize === "family") {
                    hasFamilyPortions = true;
                }
            }

            // Determine package size based on food-specific criteria
            // Priority: Special packaging > Family portions > Weight > Servings > Item count

            // If requires special packaging or has family portions, use at least large
            if (requiresSpecialPackaging || hasFamilyPortions) {
                return totalServings > 6 ? "xlarge" : "large";
            }

            // Weight-based sizing (if available)
            if (totalWeight > 0) {
                if (totalWeight < 500) return "xsmall";      // < 500g
                if (totalWeight < 1000) return "small";      // 500g - 1kg
                if (totalWeight < 2000) return "medium";     // 1kg - 2kg
                if (totalWeight < 3500) return "large";      // 2kg - 3.5kg
                return "xlarge";                              // > 3.5kg
            }

            // Serving-based sizing
            if (totalServings <= 1) return "xsmall";         // Single light meal
            if (totalServings <= 2) return "small";          // 1-2 servings
            if (totalServings <= 4) return "medium";         // 2-4 servings
            if (totalServings <= 6) return "large";          // 4-6 servings
            return "xlarge";                                  // 6+ servings

        } catch (error) {
            console.error("Package size calculation error:", error);
            return "medium"; // Safe default for food delivery
        }
    },
});
