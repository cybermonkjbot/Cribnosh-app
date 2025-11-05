import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { query, QueryCtx } from "../_generated/server";
import type { UserPreferences } from "../utils/userPreferencesFilter";
import { getUserPreferences } from "../utils/userPreferencesFilter";

// Helper type for index query builder to work around Convex type inference limitations
type IndexQueryBuilder = {
  eq: (field: string, value: unknown) => IndexQueryBuilder | unknown;
};

// Helper function to safely access index query builder
function getIndexQueryBuilder(q: unknown): IndexQueryBuilder {
  return q as unknown as IndexQueryBuilder;
}

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
  handler: async (ctx: QueryCtx, args: { userId: Id<'users'>; limit?: number; cursor?: string }) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get followers
    let followersQuery = ctx.db
      .query('userFollows')
      // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
      .withIndex('by_following', (q: unknown) => {
        return getIndexQueryBuilder(q).eq('followingId', args.userId);
      })
      .order('desc');

    if (cursor) {
      followersQuery = followersQuery.filter((q: unknown) => {
        const filterBuilder = q as unknown as { lt: (field: unknown, value: number) => boolean; field: (name: string) => unknown };
        return filterBuilder.lt(filterBuilder.field('_creationTime') as unknown, cursor) as boolean;
      });
    }

    const followers = await followersQuery.take(limit + 1);
    const hasMore = followers.length > limit;
    const followersToReturn = hasMore ? followers.slice(0, limit) : followers;

    // Get follower details and check if following back
    const followersWithDetails = await Promise.all(
      followersToReturn.map(async (follow: { followerId: Id<'users'>; _creationTime: number; [key: string]: unknown }) => {
        const follower = await ctx.db.get(follow.followerId);
        if (!follower) {
          throw new Error("Follower not found");
        }

        // Check if the followed user is also following back
        const followBack = await ctx.db
          .query('userFollows')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_follower_following', (q: unknown) => {
            const builder = getIndexQueryBuilder(q);
            const first = builder.eq('followerId', args.userId) as IndexQueryBuilder;
            return first.eq('followingId', follow.followerId);
          })
          .first();

        const followerAny = follower as { _id: Id<'users'>; name: string; avatar?: string; roles?: string[]; [key: string]: unknown };
        const followAny = follow as { _id: Id<'userFollows'>; _creationTime: number; followerId: Id<'users'>; followingId: Id<'users'>; createdAt: number; [key: string]: unknown };
        return {
          _id: followAny._id,
          _creationTime: followAny._creationTime,
          followerId: followAny.followerId,
          followingId: followAny.followingId,
          createdAt: followAny.createdAt,
          follower: {
            _id: followerAny._id,
            name: followerAny.name,
            avatar: followerAny.avatar,
            roles: followerAny.roles,
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
  handler: async (ctx: QueryCtx, args: { userId: Id<'users'>; limit?: number; cursor?: string }) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get following
    let followingQuery = ctx.db
      .query('userFollows')
      // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
      .withIndex('by_follower', (q: unknown) => {
        return getIndexQueryBuilder(q).eq('followerId', args.userId);
      })
      .order('desc');

    if (cursor) {
      followingQuery = followingQuery.filter((q: unknown) => {
        const filterBuilder = q as unknown as { lt: (field: unknown, value: number) => boolean; field: (name: string) => unknown };
        return filterBuilder.lt(filterBuilder.field('_creationTime') as unknown, cursor) as boolean;
      });
    }

    const following = await followingQuery.take(limit + 1);
    const hasMore = following.length > limit;
    const followingToReturn = hasMore ? following.slice(0, limit) : following;

    // Get following details and check if following back
    const followingWithDetails = await Promise.all(
      followingToReturn.map(async (follow: { followingId: Id<'users'>; _creationTime: number; [key: string]: unknown }) => {
        const followingUser = await ctx.db.get(follow.followingId);
        if (!followingUser) {
          throw new Error("Following user not found");
        }

        // Check if the followed user is also following back
        const followBack = await ctx.db
          .query('userFollows')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_follower_following', (q: unknown) => {
            const builder = getIndexQueryBuilder(q);
            const first = builder.eq('followerId', follow.followingId) as IndexQueryBuilder;
            return first.eq('followingId', args.userId);
          })
          .first();

        const followingUserAny = followingUser as { _id: Id<'users'>; name: string; avatar?: string; roles?: string[]; [key: string]: unknown };
        const followAny = follow as { _id: Id<'userFollows'>; _creationTime: number; followerId: Id<'users'>; followingId: Id<'users'>; createdAt: number; [key: string]: unknown };
        return {
          _id: followAny._id,
          _creationTime: followAny._creationTime,
          followerId: followAny.followerId,
          followingId: followAny.followingId,
          createdAt: followAny.createdAt,
          following: {
            _id: followingUserAny._id,
            name: followingUserAny.name,
            avatar: followingUserAny.avatar,
            roles: followingUserAny.roles,
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
  handler: async (ctx: QueryCtx, args: { followerId: Id<'users'>; followingId: Id<'users'> }) => {
    const follow = await ctx.db
      .query('userFollows')
      // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
      .withIndex('by_follower_following', (q: unknown) => {
        const builder = getIndexQueryBuilder(q);
        const first = builder.eq('followerId', args.followerId) as IndexQueryBuilder;
        return first.eq('followingId', args.followingId);
      })
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
  handler: async (ctx: QueryCtx, args: { userId: Id<'users'> }) => {
    // Get followers count
    const followers = await ctx.db
      .query('userFollows')
      // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
      .withIndex('by_following', (q: unknown) => {
        return getIndexQueryBuilder(q).eq('followingId', args.userId);
      })
      .collect();

    // Get following count
    const following = await ctx.db
      .query('userFollows')
      // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
      .withIndex('by_follower', (q: unknown) => {
        return getIndexQueryBuilder(q).eq('followerId', args.userId);
      })
      .collect();

    // Get videos count
    const videos = await ctx.db
      .query('videoPosts')
      // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
      .withIndex('by_creator', (q: unknown) => {
        return getIndexQueryBuilder(q).eq('creatorId', args.userId);
      })
      .filter((q: unknown) => {
        const filterBuilder = q as unknown as { eq: (field: unknown, value: string) => boolean; field: (name: string) => unknown };
        return filterBuilder.eq(filterBuilder.field('status') as unknown, 'published') as boolean;
      })
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
  handler: async (ctx: QueryCtx, args: { query: string; limit?: number; cursor?: string }) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;
    const searchQuery = args.query.toLowerCase();

    // Get all users
    let usersQuery = ctx.db
      .query('users')
      .order('desc');

    if (cursor) {
      usersQuery = usersQuery.filter((q: unknown) => {
        const filterBuilder = q as unknown as { lt: (field: unknown, value: number) => boolean; field: (name: string) => unknown };
        return filterBuilder.lt(filterBuilder.field('_creationTime') as unknown, cursor) as boolean;
      });
    }

    const allUsers = await usersQuery.collect();

    // Filter users based on search query
    const filteredUsers = allUsers.filter((user: { name?: string; email?: string; [key: string]: unknown }) => {
      const userAny = user as { name?: string; email?: string; [key: string]: unknown };
      return userAny.name?.toLowerCase().includes(searchQuery) ||
        userAny.email?.toLowerCase().includes(searchQuery);
    });

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
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_email', (q: unknown) => {
            return getIndexQueryBuilder(q).eq('email', email);
          })
          .first();
        currentUserId = (currentUser as { _id?: Id<'users'> } | null)?._id;
      }
    } catch (error) {
      // Ignore auth errors for anonymous users
    }

    // Get details for each user
    const usersWithDetails = await Promise.all(
      usersToReturn.map(async (user: { _id: Id<'users'>; name?: string; email?: string; avatar?: string; roles?: string[]; [key: string]: unknown }) => {
        // Get followers count
        const followers = await ctx.db
          .query('userFollows')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_following', (q: unknown) => {
            return getIndexQueryBuilder(q).eq('followingId', user._id);
          })
          .collect();

        // Get videos count
        const videos = await ctx.db
          .query('videoPosts')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_creator', (q: unknown) => {
            return getIndexQueryBuilder(q).eq('creatorId', user._id);
          })
          .filter((q: unknown) => {
            const filterBuilder = q as unknown as { eq: (field: unknown, value: string) => boolean; field: (name: string) => unknown };
            return filterBuilder.eq(filterBuilder.field('status') as unknown, 'published') as boolean;
          })
          .collect();

        // Check if current user is following this user
        let isFollowing = false;
        if (currentUserId) {
          const follow = await ctx.db
            .query('userFollows')
            // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
            .withIndex('by_follower_following', (q: unknown) => {
              const builder = getIndexQueryBuilder(q);
              const first = builder.eq('followerId', currentUserId) as IndexQueryBuilder;
              return first.eq('followingId', user._id);
            })
            .first();
          isFollowing = !!follow;
        }

        // Check if current user has blocked this user
        let isBlocked = false;
        if (currentUserId) {
          const currentUser = await ctx.db.get(currentUserId as Id<"users">);
          const currentUserAny = currentUser as { preferences?: { blockedUsers?: Id<'users'>[] }; [key: string]: unknown } | null;
          const blockedUsers = currentUserAny?.preferences?.blockedUsers || [];
          isBlocked = blockedUsers.includes(user._id);
        }

        return {
          _id: user._id,
          name: user.name || '',
          email: user.email || '',
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
  handler: async (ctx: QueryCtx, args: { limit?: number }) => {
    const limit = args.limit || 10;

    // Get current user
    let currentUserId: Id<'users'> | undefined;
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const email = identity.tokenIdentifier.split(':')[1];
        const currentUser = await ctx.db
          .query('users')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_email', (q: unknown) => {
            return getIndexQueryBuilder(q).eq('email', email);
          })
          .first();
        currentUserId = (currentUser as { _id?: Id<'users'> } | null)?._id;
      }
    } catch (error) {
      // Ignore auth errors for anonymous users
    }

    if (!currentUserId) {
      // Return popular users for anonymous users
      const allUsers = await ctx.db.query('users').collect();
      const usersWithStats = await Promise.all(
        allUsers.map(async (user: { _id: Id<'users'>; name?: string; avatar?: string; roles?: string[]; [key: string]: unknown }) => {
          const followers = await ctx.db
            .query('userFollows')
            // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
            .withIndex('by_following', (q: unknown) => {
              return getIndexQueryBuilder(q).eq('followingId', user._id);
            })
            .collect();

          const videos = await ctx.db
            .query('videoPosts')
            // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
            .withIndex('by_creator', (q: unknown) => {
              return getIndexQueryBuilder(q).eq('creatorId', user._id);
            })
            .filter((q: unknown) => {
              const filterBuilder = q as unknown as { eq: (field: unknown, value: string) => boolean; field: (name: string) => unknown };
              return filterBuilder.eq(filterBuilder.field('status') as unknown, 'published') as boolean;
            })
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
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, limit)
        .map(({ user, followersCount, videosCount }: { user: { _id: Id<'users'>; name?: string; avatar?: string; roles?: string[]; [key: string]: unknown }; followersCount: number; videosCount: number }) => ({
          _id: user._id,
          name: user.name || '',
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
      // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
      .withIndex('by_follower', (q: unknown) => {
        return getIndexQueryBuilder(q).eq('followerId', currentUserId);
      })
      .collect();

    const followingIds = new Set(following.map((f: { followingId: Id<'users'> }) => f.followingId));

    // Get users that are followed by people the current user follows
    const suggestedUsers = new Map<string, { user: { _id: Id<'users'>; [key: string]: unknown } | null; reason: string; score: number }>();

    for (const follow of following) {
      const followAny = follow as { followingId: Id<'users'>; [key: string]: unknown };
      const userFollowing = await ctx.db
        .query('userFollows')
        // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
        .withIndex('by_follower', (q: unknown) => {
          return getIndexQueryBuilder(q).eq('followerId', followAny.followingId);
        })
        .collect();

      for (const suggestion of userFollowing) {
        const suggestionAny = suggestion as { followingId: Id<'users'>; [key: string]: unknown };
        if (suggestionAny.followingId !== currentUserId && !followingIds.has(suggestionAny.followingId)) {
          const existing = suggestedUsers.get(suggestionAny.followingId);
          if (existing) {
            existing.score += 1;
            existing.reason = "Followed by people you follow";
          } else {
            suggestedUsers.set(suggestionAny.followingId, {
              user: await ctx.db.get(suggestionAny.followingId),
              reason: "Followed by people you follow",
              score: 1,
            });
          }
        }
      }
    }

    // Get user preferences for filtering
    let userPreferences: UserPreferences | null = null;
    try {
      userPreferences = await getUserPreferences(ctx, currentUserId);
    } catch {
      userPreferences = null;
    }

    // Get popular users not already followed
    const allUsers = await ctx.db.query('users').collect();
    for (const user of allUsers) {
      const userAny = user as { _id: Id<'users'>; [key: string]: unknown };
      if (!followingIds.has(userAny._id) && userAny._id !== currentUserId) {
        // Check if user is a chef
        const chef = await ctx.db
          .query('chefs')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_user', (q: unknown) => {
            return getIndexQueryBuilder(q).eq('userId', userAny._id);
          })
          .first();

        if (!chef) {
          // Not a chef, skip preference filtering
          const followers = await ctx.db
            .query('userFollows')
            // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
            .withIndex('by_following', (q: unknown) => {
              return getIndexQueryBuilder(q).eq('followingId', userAny._id);
            })
            .collect();

          const videos = await ctx.db
            .query('videoPosts')
            // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
            .withIndex('by_creator', (q: unknown) => {
              return getIndexQueryBuilder(q).eq('creatorId', userAny._id);
            })
            .filter((q: unknown) => {
              const filterBuilder = q as unknown as { eq: (field: unknown, value: string) => boolean; field: (name: string) => unknown };
              return filterBuilder.eq(filterBuilder.field('status') as unknown, 'published') as boolean;
            })
            .collect();

          const score = followers.length + videos.length;
          if (score > 0) {
            const existing = suggestedUsers.get(userAny._id);
            if (!existing || existing.score < score) {
              suggestedUsers.set(userAny._id, {
                user: userAny,
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
          const chefAny = chef as { _id: Id<'chefs'>; specialties?: string[]; [key: string]: unknown };
          const chefMeals = await ctx.db
            .query('meals')
            .filter((q: unknown) => {
              const filterBuilder = q as unknown as { eq: (field: unknown, value: Id<'chefs'>) => boolean; field: (name: string) => unknown };
              return filterBuilder.eq(filterBuilder.field('chefId') as unknown, chefAny._id) as boolean;
            })
            .filter((q: unknown) => {
              const filterBuilder = q as unknown as { eq: (field: unknown, value: string) => boolean; field: (name: string) => unknown };
              return filterBuilder.eq(filterBuilder.field('status') as unknown, 'available') as boolean;
            })
            .collect();

          // Check if any meals match user preferences (don't have allergens)
          const hasCompatibleMeals = chefMeals.some((meal: { allergens?: string[]; [key: string]: unknown }) => {
            // Check allergens
            if (meal.allergens && Array.isArray(meal.allergens)) {
              const mealAllergens = meal.allergens.map((a: string) => a.toLowerCase());
              if (userPreferences) {
                for (const allergy of userPreferences.allergies) {
                  const allergyName = allergy.name.toLowerCase();
                  if (mealAllergens.some((a: string) => 
                    a.includes(allergyName) || allergyName.includes(a)
                  )) {
                    return false; // Meal has allergen
                  }
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
          if (userPreferences.dietaryPreferences.length > 0 && chefAny.specialties && chefAny.specialties.length > 0) {
            const chefCuisines = chefAny.specialties.map((c: string) => c.toLowerCase());
            cuisineMatch = userPreferences.dietaryPreferences.some((pref: string) => {
              const prefLower = pref.toLowerCase();
              return chefCuisines.some((c: string) => c.includes(prefLower) || prefLower.includes(c));
            });
          }
        }

        const followers = await ctx.db
          .query('userFollows')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_following', (q: unknown) => {
            return getIndexQueryBuilder(q).eq('followingId', userAny._id);
          })
          .collect();

        const videos = await ctx.db
          .query('videoPosts')
          // @ts-expect-error - Convex type inference limitation: field names are inferred as 'never' for index queries
          .withIndex('by_creator', (q: unknown) => {
            return getIndexQueryBuilder(q).eq('creatorId', userAny._id);
          })
          .filter((q: unknown) => {
            const filterBuilder = q as unknown as { eq: (field: unknown, value: string) => boolean; field: (name: string) => unknown };
            return filterBuilder.eq(filterBuilder.field('status') as unknown, 'published') as boolean;
          })
          .collect();

        let score = followers.length + videos.length;
        
        // Boost score if cuisine matches user preferences
        if (cuisineMatch) {
          score += 10;
        }

        if (score > 0) {
          const existing = suggestedUsers.get(userAny._id);
          if (!existing || existing.score < score) {
            suggestedUsers.set(userAny._id, {
              user: userAny,
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
      .filter((s: { user: { _id: Id<'users'>; [key: string]: unknown } | null }) => s.user)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, limit);

    return suggestions.map((item: { user: { _id: Id<'users'>; [key: string]: unknown } | null; reason: string }) => {
      if (!item.user) {
        throw new Error('User is null');
      }
      const userAny = item.user as { _id: Id<'users'>; name?: string; avatar?: string; roles?: string[]; [key: string]: unknown };
      return {
        _id: userAny._id,
        name: userAny.name || '',
        avatar: userAny.avatar,
        roles: userAny.roles,
        followersCount: 0, // Will be calculated in the frontend
        videosCount: 0, // Will be calculated in the frontend
        isFollowing: false,
        reason: item.reason,
      };
    });
  },
});
