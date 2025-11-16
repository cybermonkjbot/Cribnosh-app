/**
 * Test script for getAllUserConnections query
 * Run with: npx convex run queries/testFriendsQuery:testGetAllUserConnections --user_id <user_id>
 */

import { v } from "convex/values";
import { api } from "../_generated/api";
import { query } from "../_generated/server";

// Test query to get all user connections with detailed breakdown
export const testGetAllUserConnections = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    // Call the actual getAllUserConnections query
    const connections = await ctx.runQuery(api.queries.userConnections.getAllUserConnections, {
      user_id: args.user_id,
    });
    
    // Get user info for context
    const user = await ctx.db.get(args.user_id);
    
    // Analyze connections
    const byType = connections.reduce((acc: Record<string, number>, conn) => {
      acc[conn.connection_type] = (acc[conn.connection_type] || 0) + 1;
      return acc;
    }, {});
    
    const bySource = connections.reduce((acc: Record<string, number>, conn) => {
      acc[conn.source] = (acc[conn.source] || 0) + 1;
      return acc;
    }, {});
    
    // Check for reverse referrals specifically
    const reverseReferrals = connections.filter(
      conn => conn.source === 'referral_reverse'
    );
    
    return {
      user: {
        id: args.user_id,
        name: user?.name || 'Unknown',
        email: user?.email || 'Unknown',
      },
      summary: {
        total_connections: connections.length,
        unique_users: new Set(connections.map(c => c.user_id)).size,
      },
      breakdown: {
        by_connection_type: byType,
        by_source: bySource,
      },
      reverse_referrals: {
        count: reverseReferrals.length,
        users: reverseReferrals.map(r => ({
          user_id: r.user_id,
          user_name: r.user_name,
          metadata: r.metadata,
        })),
      },
      sample_connections: connections.slice(0, 10).map(conn => ({
        user_id: conn.user_id,
        user_name: conn.user_name,
        connection_type: conn.connection_type,
        source: conn.source,
        metadata: conn.metadata,
      })),
    };
  },
});

