import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";

// Get user's followers
export const getUserFollowers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    followers: v.array(v.object({
      _id: v.id("userFollows"),
      _creationTime: v.number(),
      followerId: v.id("users"),
      followingId: v.id("users"),
      createdAt: v.number(),
      follower: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatar: v.optional(v.string()),
        roles: v.optional(v.array(v.string())),
      }),
      isFollowingBack: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get followers
    let followersQuery = ctx.db
      .query('userFollows')
      .withIndex('by_following', q => q.eq('followingId', args.userId))
      .order('desc');

    if (cursor) {
      followersQuery = followersQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const followers = await followersQuery.take(limit + 1);
    const hasMore = followers.length > limit;
    const followersToReturn = hasMore ? followers.slice(0, limit) : followers;

    // Get follower details and check if following back
    const followersWithDetails = await Promise.all(
      followersToReturn.map(async (follow) => {
        const follower = await ctx.db.get(follow.followerId);
        if (!follower) {
          throw new Error("Follower not found");
        }

        // Check if the followed user is also following back
        const followBack = await ctx.db
          .query('userFollows')
          .withIndex('by_follower_following', q => q.eq('followerId', args.userId).eq('followingId', follow.followerId))
          .first();

        return {
          ...follow,
          follower: {
            _id: follower._id,
            name: follower.name,
            avatar: follower.avatar,
            roles: follower.roles,
          },
          isFollowingBack: !!followBack,
        };
      })
    );

    const nextCursor = hasMore ? followersToReturn[followersToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      followers: followersWithDetails,
      nextCursor,
    };
  },
});

// Get users that a user is following
export const getUserFollowing = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    following: v.array(v.object({
      _id: v.id("userFollows"),
      _creationTime: v.number(),
      followerId: v.id("users"),
      followingId: v.id("users"),
      createdAt: v.number(),
      following: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatar: v.optional(v.string()),
        roles: v.optional(v.array(v.string())),
      }),
      isFollowingBack: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get following
    let followingQuery = ctx.db
      .query('userFollows')
      .withIndex('by_follower', q => q.eq('followerId', args.userId))
      .order('desc');

    if (cursor) {
      followingQuery = followingQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const following = await followingQuery.take(limit + 1);
    const hasMore = following.length > limit;
    const followingToReturn = hasMore ? following.slice(0, limit) : following;

    // Get following details and check if following back
    const followingWithDetails = await Promise.all(
      followingToReturn.map(async (follow) => {
        const followingUser = await ctx.db.get(follow.followingId);
        if (!followingUser) {
          throw new Error("Following user not found");
        }

        // Check if the followed user is also following back
        const followBack = await ctx.db
          .query('userFollows')
          .withIndex('by_follower_following', q => q.eq('followerId', follow.followingId).eq('followingId', args.userId))
          .first();

        return {
          ...follow,
          following: {
            _id: followingUser._id,
            name: followingUser.name,
            avatar: followingUser.avatar,
            roles: followingUser.roles,
          },
          isFollowingBack: !!followBack,
        };
      })
    );

    const nextCursor = hasMore ? followingToReturn[followingToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      following: followingWithDetails,
      nextCursor,
    };
  },
});

// Check if user is following another user
export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', q => q.eq('followerId', args.followerId).eq('followingId', args.followingId))
      .first();

    return !!follow;
  },
});

// Get follow stats for a user
export const getUserFollowStats = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.object({
    followersCount: v.number(),
    followingCount: v.number(),
    videosCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get followers count
    const followers = await ctx.db
      .query('userFollows')
      .withIndex('by_following', q => q.eq('followingId', args.userId))
      .collect();

    // Get following count
    const following = await ctx.db
      .query('userFollows')
      .withIndex('by_follower', q => q.eq('followerId', args.userId))
      .collect();

    // Get videos count
    const videos = await ctx.db
      .query('videoPosts')
      .withIndex('by_creator', q => q.eq('creatorId', args.userId))
      .filter(q => q.eq(q.field('status'), 'published'))
      .collect();

    return {
      followersCount: followers.length,
      followingCount: following.length,
      videosCount: videos.length,
    };
  },
});

// Search users to follow
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    users: v.array(v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      avatar: v.optional(v.string()),
      roles: v.optional(v.array(v.string())),
      followersCount: v.number(),
      videosCount: v.number(),
      isFollowing: v.boolean(),
      isBlocked: v.boolean(),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;
    const searchQuery = args.query.toLowerCase();

    // Get all users
    let usersQuery = ctx.db
      .query('users')
      .order('desc');

    if (cursor) {
      usersQuery = usersQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const allUsers = await usersQuery.collect();

    // Filter users based on search query
    const filteredUsers = allUsers.filter(user => 
      user.name.toLowerCase().includes(searchQuery) ||
      user.email.toLowerCase().includes(searchQuery)
    );

    // Apply pagination
    const hasMore = filteredUsers.length > limit;
    const usersToReturn = hasMore ? filteredUsers.slice(0, limit) : filteredUsers;

    // Get current user for follow/block status
    let currentUserId: string | undefined;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const email = identity.tokenIdentifier.split(':')[1];
        const currentUser = await ctx.db
          .query('users')
          .withIndex('by_email', q => q.eq('email', email))
          .first();
        currentUserId = currentUser?._id;
      }
    } catch (error) {
      // Ignore auth errors for anonymous users
    }

    // Get details for each user
    const usersWithDetails = await Promise.all(
      usersToReturn.map(async (user) => {
        // Get followers count
        const followers = await ctx.db
          .query('userFollows')
          .withIndex('by_following', q => q.eq('followingId', user._id))
          .collect();

        // Get videos count
        const videos = await ctx.db
          .query('videoPosts')
          .withIndex('by_creator', q => q.eq('creatorId', user._id))
          .filter(q => q.eq(q.field('status'), 'published'))
          .collect();

        // Check if current user is following this user
        let isFollowing = false;
        if (currentUserId) {
          const follow = await ctx.db
            .query('userFollows')
            .withIndex('by_follower_following', q => q.eq('followerId', currentUserId as Id<"users">).eq('followingId', user._id))
            .first();
          isFollowing = !!follow;
        }

        // Check if current user has blocked this user
        let isBlocked = false;
        if (currentUserId) {
          const currentUser = await ctx.db.get(currentUserId as Id<"users">);
          const blockedUsers = currentUser?.preferences?.blockedUsers || [];
          isBlocked = blockedUsers.includes(user._id);
        }

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          roles: user.roles,
          followersCount: followers.length,
          videosCount: videos.length,
          isFollowing,
          isBlocked,
        };
      })
    );

    const nextCursor = hasMore ? usersToReturn[usersToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      users: usersWithDetails,
      nextCursor,
    };
  },
});

// Get suggested users to follow
export const getSuggestedUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    name: v.string(),
    avatar: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    followersCount: v.number(),
    videosCount: v.number(),
    isFollowing: v.boolean(),
    reason: v.string(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get current user
    let currentUserId: string | undefined;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const email = identity.tokenIdentifier.split(':')[1];
        const currentUser = await ctx.db
          .query('users')
          .withIndex('by_email', q => q.eq('email', email))
          .first();
        currentUserId = currentUser?._id;
      }
    } catch (error) {
      // Ignore auth errors for anonymous users
    }

    if (!currentUserId) {
      // Return popular users for anonymous users
      const allUsers = await ctx.db.query('users').collect();
      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          const followers = await ctx.db
            .query('userFollows')
            .withIndex('by_following', q => q.eq('followingId', user._id))
            .collect();

          const videos = await ctx.db
            .query('videoPosts')
            .withIndex('by_creator', q => q.eq('creatorId', user._id))
            .filter(q => q.eq(q.field('status'), 'published'))
            .collect();

          return {
            user,
            followersCount: followers.length,
            videosCount: videos.length,
            score: followers.length + videos.length,
          };
        })
      );

      return usersWithStats
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ user, followersCount, videosCount }) => ({
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          roles: user.roles,
          followersCount,
          videosCount,
          isFollowing: false,
          reason: "Popular on Nosh Heaven",
        }));
    }

    // Get users that current user is following
    const following = await ctx.db
      .query('userFollows')
      .withIndex('by_follower', q => q.eq('followerId', currentUserId as Id<"users">))
      .collect();

    const followingIds = new Set(following.map(f => f.followingId));

    // Get users that are followed by people the current user follows
    const suggestedUsers = new Map<string, { user: any; reason: string; score: number }>();

    for (const follow of following) {
      const userFollowing = await ctx.db
        .query('userFollows')
        .withIndex('by_follower', q => q.eq('followerId', follow.followingId))
        .collect();

      for (const suggestion of userFollowing) {
        if (suggestion.followingId !== currentUserId && !followingIds.has(suggestion.followingId)) {
          const existing = suggestedUsers.get(suggestion.followingId);
          if (existing) {
            existing.score += 1;
            existing.reason = "Followed by people you follow";
          } else {
            suggestedUsers.set(suggestion.followingId, {
              user: await ctx.db.get(suggestion.followingId),
              reason: "Followed by people you follow",
              score: 1,
            });
          }
        }
      }
    }

    // Get user preferences for filtering
    let userPreferences;
    try {
      userPreferences = await getUserPreferences(ctx, currentUserId as Id<'users'>);
    } catch {
      userPreferences = null;
    }

    // Get popular users not already followed
    const allUsers = await ctx.db.query('users').collect();
    for (const user of allUsers) {
      if (!followingIds.has(user._id) && user._id !== currentUserId) {
        // Check if user is a chef
        const chef = await ctx.db
          .query('chefs')
          .withIndex('by_user', q => q.eq('userId', user._id))
          .first();

        if (!chef) {
          // Not a chef, skip preference filtering
          const followers = await ctx.db
            .query('userFollows')
            .withIndex('by_following', q => q.eq('followingId', user._id))
            .collect();

          const videos = await ctx.db
            .query('videoPosts')
            .withIndex('by_creator', q => q.eq('creatorId', user._id))
            .filter(q => q.eq(q.field('status'), 'published'))
            .collect();

          const score = followers.length + videos.length;
          if (score > 0) {
            const existing = suggestedUsers.get(user._id);
            if (!existing || existing.score < score) {
              suggestedUsers.set(user._id, {
                user,
                reason: "Popular on Nosh Heaven",
                score,
              });
            }
          }
          continue;
        }

        // For chefs, check if they have meals matching user preferences
        let cuisineMatch = false;
        if (userPreferences) {
          const chefMeals = await ctx.db
            .query('meals')
            .filter(q => q.eq(q.field('chefId'), chef._id))
            .filter(q => q.eq(q.field('status'), 'available'))
            .collect();

          // Check if any meals match user preferences (don't have allergens)
          const hasCompatibleMeals = chefMeals.some(meal => {
            // Check allergens
            if (meal.allergens && Array.isArray(meal.allergens)) {
              const mealAllergens = meal.allergens.map((a: string) => a.toLowerCase());
              for (const allergy of userPreferences.allergies) {
                const allergyName = allergy.name.toLowerCase();
                if (mealAllergens.some((a: string) => 
                  a.includes(allergyName) || allergyName.includes(a)
                )) {
                  return false; // Meal has allergen
                }
              }
            }
            return true; // Meal is compatible
          });

          // If no compatible meals, skip this chef
          if (!hasCompatibleMeals) {
            continue;
          }

          // Check if chef's cuisine matches user preferences
          if (userPreferences.dietaryPreferences.length > 0 && chef.specialties?.length > 0) {
            const chefCuisines = (chef.specialties || []).map((c: string) => c.toLowerCase());
            cuisineMatch = userPreferences.dietaryPreferences.some(pref => {
              const prefLower = pref.toLowerCase();
              return chefCuisines.some((c: string) => c.includes(prefLower) || prefLower.includes(c));
            });
          }
        }

        const followers = await ctx.db
          .query('userFollows')
          .withIndex('by_following', q => q.eq('followingId', user._id))
          .collect();

        const videos = await ctx.db
          .query('videoPosts')
          .withIndex('by_creator', q => q.eq('creatorId', user._id))
          .filter(q => q.eq(q.field('status'), 'published'))
          .collect();

        let score = followers.length + videos.length;
        
        // Boost score if cuisine matches user preferences
        if (cuisineMatch) {
          score += 10;
        }

        if (score > 0) {
          const existing = suggestedUsers.get(user._id);
          if (!existing || existing.score < score) {
            suggestedUsers.set(user._id, {
              user,
              reason: cuisineMatch 
                ? "Matches your preferences"
                : "Popular on Nosh Heaven",
              score,
            });
          }
        }
      }
    }

    // Sort by score and return top suggestions
    const suggestions = Array.from(suggestedUsers.values())
      .filter(s => s.user)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return suggestions.map(({ user, reason }) => ({
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      roles: user.roles,
      followersCount: 0, // Will be calculated in the frontend
      videosCount: 0, // Will be calculated in the frontend
      isFollowing: false,
      reason,
    }));
  },
});
