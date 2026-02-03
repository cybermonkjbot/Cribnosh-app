// @ts-nocheck
"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Helper to authenticate user from session token
 */
async function authenticateUser(ctx: any, sessionToken: string) {
  const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
    sessionToken,
  });
  return user?._id || null;
}

/**
 * Get Nosh Heaven Feed - Unified feed for Recipes, Stories, Videos, and Live streams
 */
export const getNoshHeavenFeed = action({
  args: {
    sessionToken: v.string(),
    category: v.union(
      v.literal("recipes"),
      v.literal("stories"),
      v.literal("videos"),
      v.literal("live")
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      items: v.array(v.any()),
      nextCursor: v.optional(v.string()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const limit = args.limit || 20;

      switch (args.category) {
        case "recipes": {
          const result = await ctx.runQuery(api.queries.recipes.getRecipes, {
            limit,
            cursor: args.cursor,
            search: args.search,
          });

          return {
            success: true as const,
            items: result.recipes.map(recipe => ({
              type: "recipe" as const,
              id: recipe._id,
              title: recipe.title,
              description: recipe.description,
              image: recipe.featuredImage,
              author: recipe.author,
              cuisine: recipe.cuisine,
              difficulty: recipe.difficulty,
              prepTime: recipe.prepTime,
              cookTime: recipe.cookTime,
              servings: recipe.servings,
              createdAt: recipe.createdAt,
              updatedAt: recipe.updatedAt,
            })),
            nextCursor: result.nextCursor,
            total: result.recipes.length,
          };
        }

        case "stories": {
          const result = await ctx.runQuery(api.queries.blog.getBlogPosts, {
            limit,
            search: args.search,
            status: "published",
          });

          return {
            success: true as const,
            items: result.map(post => ({
              type: "story" as const,
              id: post._id,
              title: post.title,
              description: post.excerpt || post.content?.substring(0, 200),
              image: post.coverImage || post.featuredImage,
              author: post.author?.name || "Unknown",
              categories: post.categories || [],
              tags: post.tags || [],
              viewCount: post.viewCount || 0,
              likeCount: post.likeCount || 0,
              commentCount: post.commentCount || 0,
              publishedAt: post.publishedAt || post.createdAt,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            })),
            nextCursor: undefined,
            total: result.length,
          };
        }

        case "videos": {
          const result = await ctx.runQuery(api.queries.videoPosts.getVideoFeed, {
            limit,
            cursor: args.cursor,
          });

          // Filter by search if provided
          let videos = result.videos;
          if (args.search) {
            const searchLower = args.search.toLowerCase();
            videos = videos.filter(video =>
              video.title.toLowerCase().includes(searchLower) ||
              video.description?.toLowerCase().includes(searchLower) ||
              video.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
            );
          }

          return {
            success: true as const,
            items: videos.map(video => ({
              type: "video" as const,
              id: video._id,
              title: video.title,
              description: video.description,
              videoUrl: video.videoUrl,
              thumbnailUrl: video.thumbnailUrl,
              duration: video.duration,
              creator: video.creator,
              cuisine: video.cuisine,
              difficulty: video.difficulty,
              tags: video.tags,
              likesCount: video.likesCount,
              commentsCount: video.commentsCount,
              sharesCount: video.sharesCount,
              viewsCount: video.viewsCount,
              isLiked: video.isLiked,
              publishedAt: video.publishedAt || video.createdAt,
              createdAt: video.createdAt,
            })),
            nextCursor: result.nextCursor,
            total: videos.length,
          };
        }

        case "live": {
          const result = await ctx.runAction(api.actions.liveStreaming.customerGetLiveStreams, {
            sessionToken: args.sessionToken,
            limit,
            page: args.cursor ? parseInt(args.cursor) : 1,
          });

          if (!result.success) {
            return result;
          }

          return {
            success: true as const,
            items: result.streams.map(stream => ({
              type: "live" as const,
              id: stream.id,
              title: stream.kitchen_name,
              description: stream.description,
              thumbnailUrl: stream.thumbnail_url,
              chefName: stream.chef_name,
              viewerCount: stream.viewer_count,
              isLive: stream.is_live,
              startedAt: stream.started_at,
            })),
            nextCursor: result.total > limit ? ((args.cursor ? parseInt(args.cursor) : 1) + 1).toString() : undefined,
            total: result.total,
          };
        }

        default:
          return { success: false as const, error: 'Invalid category' };
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get Nosh Heaven feed';
      return { success: false as const, error: errorMessage };
    }
  },
});

