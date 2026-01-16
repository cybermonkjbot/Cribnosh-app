import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action, query } from "../_generated/server";

/**
 * Get live courier location for an order
 * Returns the most recent location update from deliveryTracking
 */
export const getCourierLocation = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        // Find the delivery assignment for this order
        const assignment = await ctx.db
            .query("deliveryAssignments")
            .withIndex("by_order_id", (q) => q.eq("order_id", args.orderId))
            .first();

        if (!assignment || assignment.provider !== "stuart") {
            return null;
        }

        // Get the most recent location update
        const latestLocation = await ctx.db
            .query("deliveryTracking")
            .withIndex("by_assignment_id", (q) => q.eq("assignment_id", assignment._id))
            .order("desc")
            .first();

        if (!latestLocation) {
            return null;
        }

        return {
            latitude: latestLocation.location.latitude,
            longitude: latestLocation.location.longitude,
            accuracy: latestLocation.location.accuracy,
            timestamp: latestLocation.timestamp,
            metadata: latestLocation.metadata,
        };
    },
});

/**
 * Get Stuart delivery ETA for an order
 * Fetches fresh ETA from Stuart API
 */
export const getDeliveryETA = action({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        // Find the delivery assignment for this order
        const assignment = await ctx.runQuery(internal.queries.stuart.getAssignmentByOrderId, {
            orderId: args.orderId,
        });

        if (!assignment || assignment.provider !== "stuart" || !assignment.external_id) {
            return null;
        }

        // Fetch fresh ETA from Stuart
        const eta = await ctx.runAction(internal.stuart_integration.getJobETA, {
            jobId: assignment.external_id,
            type: "dropoff",
        });

        return eta;
    },
});

/**
 * Get proof of delivery for an order
 */
export const getProofOfDelivery = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        // Find the delivery assignment for this order
        const assignment = await ctx.db
            .query("deliveryAssignments")
            .withIndex("by_order_id", (q) => q.eq("order_id", args.orderId))
            .first();

        if (!assignment || assignment.provider !== "stuart") {
            return null;
        }

        // Check if proof of delivery is available
        if (!assignment.proof_of_delivery_photo) {
            return null;
        }

        return {
            photo: assignment.proof_of_delivery_photo,
            signature: assignment.proof_of_delivery_signature,
            notes: assignment.proof_of_delivery_notes,
            deliveredAt: assignment.actual_delivery_time,
        };
    },
});

/**
 * Get Stuart assignment by order ID (internal helper)
 */
export const getAssignmentByOrderId = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const assignment = await ctx.db
            .query("deliveryAssignments")
            .withIndex("by_order_id", (q) => q.eq("order_id", args.orderId))
            .first();

        return assignment;
    },
});

/**
 * Get full Stuart job details for admin
 */
export const getJobDetails = action({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const assignment = await ctx.runQuery(internal.queries.stuart.getAssignmentByOrderId, {
            orderId: args.orderId,
        });

        if (!assignment || assignment.provider !== "stuart" || !assignment.external_id) {
            return null;
        }

        // Fetch full job details from Stuart
        const jobDetails = await ctx.runAction(internal.stuart_integration.getJobDetails, {
            jobId: assignment.external_id,
        });

        return jobDetails;
    },
});
