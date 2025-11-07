import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import type {
  LiveSession,
  User
} from "../types/livestream";
import { calculateDistance } from "../types/livestream";

// Type for the enriched session with distance
interface NearbySession extends Omit<LiveSession, 'location'> {
  distance: number;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// Get nearby live sessions
export const getNearbyLiveSessions = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    maxDistanceKm: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<NearbySession[]> => {
    const maxDistance = args.maxDistanceKm || 50; // Default 50km
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get all active sessions - using status instead of isActive
    const activeSessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    // Calculate distance for sessions with location data
    const nearbySessions: NearbySession[] = await Promise.all(activeSessions.map(async (session) => {
      let distance = 0;
      let location = {
        coordinates: [0, 0] as [number, number] // Default coordinates
      };
      
      // Use session location if available, otherwise get chef location
      if (session.location && session.location.coordinates) {
        location = {
          coordinates: session.location.coordinates as [number, number]
        };
        distance = calculateDistance(
          args.latitude,
          args.longitude,
          session.location.coordinates[1], // latitude
          session.location.coordinates[0]  // longitude
        );
      } else {
            // Fallback: get chef location from chefs table
            try {
              const chef = await ctx.db.get(session.chef_id);
              if (chef && chef.location) {
                location = {
                  coordinates: chef.location.coordinates as [number, number]
                };
                distance = calculateDistance(
                  args.latitude,
                  args.longitude,
                  chef.location.coordinates[1], // latitude
                  chef.location.coordinates[0]  // longitude
                );
              } else {
                console.log(`Chef ${session.chef_id} has no location data`);
              }
            } catch (error) {
              console.error(`Failed to get chef location for session ${session._id}:`, error);
            }
          }
      
      return {
        _id: session._id,
        _creationTime: session._creationTime,
        channelName: session.session_id, // Using session_id as channelName
        chefId: session.chef_id,
        title: session.title,
        description: session.description || "",
        mealId: session.session_id as Id<"meals">, // Using session_id as mealId
        isActive: session.status === "live",
        startedAt: session.actual_start_time || session.scheduled_start_time,
        endedAt: session.endedAt,
        endReason: session.endReason,
        thumbnailUrl: session.thumbnailUrl,
        tags: session.tags || [],
        viewerCount: session.viewerCount || 0,
        peakViewers: session.sessionStats?.peakViewers || 0,
        distance,
        location
      };
    }));

    // Filter by distance and sort by proximity
    const filteredSessions = nearbySessions.filter(session => 
      session.distance <= maxDistance
    );
    
    // Sort by distance (closest first), then by creation time
    return filteredSessions
      .sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return b._creationTime - a._creationTime;
      })
      .slice(0, 20); // Limit to 20 sessions
  },
});

// Define types for the order with user details
interface EnrichedLiveOrder {
  _id: Id<"liveOrders">;
  _creationTime: number;
  channelName: string;
  orderId: Id<"orders">;
  userId: Id<"users">;
  quantity: number;
  deliveryAddress: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  createdAt: number;
  updatedAt: number;
  user: User | null;
}

// Get live orders for chef
export const getLiveOrdersForChef = query({
  args: {},
  handler: async (ctx): Promise<EnrichedLiveOrder[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the chef associated with the current user
    const chef = await ctx.db
      .query("chefs")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();

    if (!chef) {
      throw new Error("Chef not found for this user");
    }

    // Get active sessions for this chef
    const sessions = await ctx.db
      .query("liveSessions")
      .withIndex("by_chef", (q) => q.eq("chef_id", chef._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .collect();

    if (sessions.length === 0) {
      return [];
    }

    // Get all orders for these sessions
    const channelNames = Array.from(new Set(sessions.map(s => s.session_id)));
    const ordersPromises = channelNames.map(channelName => 
      ctx.db
        .query("liveOrders")
        .withIndex("by_channel", q => q.eq("channelName", channelName))
        .collect()
    );
    const ordersResults = await Promise.all(ordersPromises);
    const orders = ordersResults.flat();

    // Enrich orders with user details
    const enrichedOrders: EnrichedLiveOrder[] = [];
    for (const order of orders) {
      if (!order) continue; // Skip any null/undefined orders
      
      const user = await ctx.db.get(order.userId);
      if (!user) continue; // Skip if user not found
      
      enrichedOrders.push({
        _id: order._id,
        _creationTime: order._creationTime,
        channelName: order.channelName,
        orderId: order.orderId,
        userId: order.userId,
        quantity: order.quantity,
        deliveryAddress: order.deliveryAddress,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        user: {
          _id: user._id,
          _creationTime: user._creationTime,
          name: user.name,
          email: user.email,
          roles: user.roles,
          status: user.status,
          lastActiveAt: user.lastLogin,
          profileImageUrl: user.avatar
        }
      });
    }

    return enrichedOrders;
  },
});

// Type for the stats response
interface LiveSessionStats {
  activeSessions: number;
  completedSessions: number;
  totalSessions: number;
  totalViewers: number;
  avgViewers: number;
  peakViewers: number;
}

// Admin: Get live session stats
export const adminGetLiveSessionStats = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d")
    )),
  },
  handler: async (ctx, args): Promise<LiveSessionStats> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
      throw new Error("Not authorized");
    }

    const now = Date.now();
    let startTime = 0;
    
    switch (args.timeRange) {
      case "24h":
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case "7d":
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
      default:
        startTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    // Get active sessions within time range with explicit type
    const activeSessions = await ctx.db
      .query("liveSessions")
      .filter((q) => {
        const scheduledStartTime = q.field("scheduled_start_time");
        const status = q.field("status");
        return q.and(
          q.gte(scheduledStartTime, startTime),
          q.eq(status, "live")
        );
      })
      .collect();

    // Get completed sessions within time range with explicit type
    const completedSessions = await ctx.db
      .query("liveSessions")
      .filter((q) => {
        const scheduledStartTime = q.field("scheduled_start_time");
        const status = q.field("status");
        return q.and(
          q.gte(scheduledStartTime, startTime),
          q.eq(status, "ended")
        );
      })
      .collect();

    // Calculate stats
    const totalSessions = activeSessions.length + completedSessions.length;
    const totalViewers = completedSessions.reduce(
      (sum, session) => sum + (session.viewerCount ?? 0),
      0
    );
    const avgViewers = totalSessions > 0 ? Math.round(totalViewers / totalSessions) : 0;

    // Ensure we have valid numbers for peak viewers calculation
    const completedPeakViewers = completedSessions
      .map(s => s.sessionStats?.peakViewers ?? 0)
      .filter(Number.isFinite) as number[];
    const activePeakViewers = activeSessions
      .map(s => s.sessionStats?.peakViewers ?? 0)
      .filter(Number.isFinite) as number[];

    // Calculate peak viewers, default to 0 if no sessions
    const allPeakViewers = [...completedPeakViewers, ...activePeakViewers];
    const peakViewers = allPeakViewers.length > 0 ? Math.max(...allPeakViewers) : 0;

    return {
      activeSessions: activeSessions.length,
      completedSessions: completedSessions.length,
      totalSessions,
      totalViewers,
      avgViewers,
      peakViewers,
    };
  },
});

// Type for the report status
type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

// Type for the enriched report
type EnrichedReport = {
  _id: string;
  _creationTime: number;
  sessionId: string;
  reporterId: string;
  channelName: string;
  reason: string;
  status: ReportStatus;
  reportedAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionNotes?: string;
  sessionTitle: string;
  reporterName: string;
};

// Admin: Get live session reports
export const adminGetLiveReports = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewing"),
        v.literal("resolved"),
        v.literal("dismissed")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<EnrichedReport[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin with proper type checking
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
      throw new Error("Not authorized");
    }

    try {
      // Base query with proper type
      let reports;
      
      // Add status filter if provided
      if (args.status) {
        reports = await ctx.db.query("liveSessionReports")
          .withIndex("by_status", (q) => 
            q.eq("status", args.status as ReportStatus)
          )
          .collect();
      } else {
        reports = await ctx.db.query("liveSessionReports")
          .withIndex("by_session")
          .collect();
      }
      
      // Validate and process reports
      if (!Array.isArray(reports)) {
        console.error('Unexpected reports format:', reports);
        throw new Error('Failed to fetch reports');
      }

      // Sort by reportedAt desc and apply limit with proper type safety
      const sortedReports = reports
        .filter((report): report is typeof report & { reportedAt: number } => 
          typeof report.reportedAt === 'number'
        )
        .sort((a, b) => b.reportedAt - a.reportedAt)
        .slice(0, Math.min(args.limit ?? 50, 100)); // Cap limit at 100 for safety

      // Enrich with session and reporter details
      const enrichedReports = await Promise.all(
        sortedReports.map(async (report) => {
          try {
            const [session, reporter] = await Promise.all([
              ctx.db
                .query("liveSessions")
                .withIndex("by_session_id", (q) => 
                  q.eq("session_id", report.channelName)
                )
                .first(),
              ctx.db.get(report.reporterId),
            ]);
            
            return {
              ...report,
              sessionTitle: session?.title ?? 'Session not found',
              reporterName: reporter?.name ?? 'Unknown',
            } as EnrichedReport;
          } catch (error) {
            console.error('Error enriching report:', error);
            return {
              ...report,
              sessionTitle: 'Error loading session',
              reporterName: 'Error loading reporter',
            } as EnrichedReport;
          }
        })
      );

      return enrichedReports;
    } catch (error) {
      console.error('Error in adminGetLiveReports:', error);
      throw new Error('Failed to fetch live session reports');
    }
  },
});

// Admin: Get all live sessions
export const list = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("ended"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
      throw new Error("Not authorized");
    }

    let sessions;
    
    if (args.status === "active") {
      sessions = await ctx.db
        .query("liveSessions")
        .withIndex("by_status", (q) => q.eq("status", "live"))
        .collect();
    } else if (args.status === "ended") {
      sessions = await ctx.db
        .query("liveSessions")
        .withIndex("by_status", (q) => q.eq("status", "ended"))
        .collect();
    } else {
      sessions = await ctx.db.query("liveSessions").collect();
    }

    // Sort by creation time (newest first) and apply limit
    const sortedSessions = sessions
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, Math.min(args.limit ?? 50, 100));

    return sortedSessions;
  },
});

// Get live comments for a session
export const getLiveComments = query({
  args: {
    sessionId: v.id('liveSessions'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    commentType: v.optional(v.union(
      v.literal('general'),
      v.literal('question'),
      v.literal('reaction'),
      v.literal('tip'),
      v.literal('moderation')
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let query = ctx.db
      .query('liveComments')
      .filter(q => q.eq(q.field('session_id'), args.sessionId))
      .filter(q => q.eq(q.field('status'), 'active'));

    if (args.commentType) {
      query = query.filter(q => q.eq(q.field('commentType'), args.commentType));
    }

    const comments = await query
      .order('desc')
      .collect();

    // Manual pagination since Convex doesn't support skip/take on ordered queries
    const paginated = comments.slice(offset, offset + limit);

    return paginated;
  },
});

// Get live reactions for a session
export const getLiveReactions = query({
  args: {
    sessionId: v.id('liveSessions'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    reactionType: v.optional(v.union(
      v.literal('like'),
      v.literal('love'),
      v.literal('laugh'),
      v.literal('wow'),
      v.literal('sad'),
      v.literal('angry'),
      v.literal('fire'),
      v.literal('clap'),
      v.literal('heart'),
      v.literal('star')
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const offset = args.offset || 0;

    let query = ctx.db
      .query('liveReactions')
      .filter(q => q.eq(q.field('session_id'), args.sessionId))
      .filter(q => q.eq(q.field('status'), 'active'));

    if (args.reactionType) {
      query = query.filter(q => q.eq(q.field('reactionType'), args.reactionType));
    }

    const reactions = await query
      .order('desc')
      .collect();

    // Manual pagination since Convex doesn't support skip/take on ordered queries
    const paginated = reactions.slice(offset, offset + limit);

    return paginated;
  },
});

// Get live session by ID
export const getLiveSessionById = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_session_id', q => q.eq('session_id', args.sessionId))
      .first();

    return session;
  },
});

// Get live session with enriched data (chef and meal)
export const getLiveSessionWithMeal = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get session
    const session = await ctx.db
      .query('liveSessions')
      .withIndex('by_session_id', q => q.eq('session_id', args.sessionId))
      .first();

    if (!session) {
      return null;
    }

    // Get chef data
    const chef = await ctx.db.get(session.chef_id);
    
    // Get current viewer count
    const allViewers = await ctx.db
      .query("liveViewers")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    
    // Filter to only active viewers (those who haven't left)
    const viewers = allViewers.filter(viewer => viewer.leftAt === undefined);

    // Find meal by matching session title/tags with meal name
    // Search chef's meals for a match
    const chefMeals = await ctx.db
      .query('meals')
      .filter(q => q.eq(q.field('chefId'), session.chef_id))
      .filter(q => q.eq(q.field('status'), 'available'))
      .collect();

    // Try to match by title/tags
    let matchedMeal: Doc<'meals'> | null = null;
    const sessionTitleLower = session.title.toLowerCase();
    const sessionTags = session.tags || [];
    
    // First try exact or partial match with meal name
    matchedMeal = chefMeals.find((meal: Doc<'meals'>) => {
      const mealNameLower = meal.name?.toLowerCase() || '';
      return mealNameLower.includes(sessionTitleLower) || 
             sessionTitleLower.includes(mealNameLower);
    }) || null;

    // If no match, try matching tags
    if (!matchedMeal && sessionTags.length > 0) {
      matchedMeal = chefMeals.find((meal: Doc<'meals'>) => {
        const mealCuisine = meal.cuisine || [];
        return sessionTags.some(tag => 
          mealCuisine.some((c: string) => c.toLowerCase().includes(tag.toLowerCase()))
        );
      }) || null;
    }

    // If still no match, get the first available meal from chef
    if (!matchedMeal && chefMeals.length > 0) {
      matchedMeal = chefMeals[0];
    }

    // Get meal reviews for rating
    let mealData = null;
    if (matchedMeal) {
      const reviews = await ctx.db
        .query('reviews')
        .filter((q: any) => q.eq(q.field('mealId'), matchedMeal!._id))
        .collect();

      mealData = {
        ...matchedMeal,
        reviewCount: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
          : matchedMeal.rating || 0,
      };
    }

    return {
      session: {
        ...session,
        currentViewers: viewers.length,
        viewerCount: viewers.length,
      },
      chef: chef ? {
        _id: chef._id,
        name: chef.name || `Chef ${chef._id}`,
        bio: chef.bio,
        specialties: chef.specialties || [],
        rating: chef.rating || 0,
        profileImage: chef.profileImage,
      } : null,
      meal: mealData,
    };
  },
});
