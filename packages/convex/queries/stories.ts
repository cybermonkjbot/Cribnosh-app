import { v } from 'convex/values';
import { query } from '../_generated/server';

/**
 * Get stories by author (chef name) - returns all statuses for chef's own content
 */
export const getByAuthor = query({
  args: {
    author: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all stories by author (including drafts and archived)
    const stories = await ctx.db
      .query('stories' as any)
      .withIndex('by_author' as any, (q: any) => q.eq('authorName', args.author))
      .collect();
    
    // Sort by creation time (newest first)
    stories.sort((a: any, b: any) => {
      const timeA = a.createdAt || a._creationTime || 0;
      const timeB = b.createdAt || b._creationTime || 0;
      return timeB - timeA;
    });
    
    return stories;
  },
});

/**
 * Get story by ID
 */
export const getById = query({
  args: {
    storyId: v.id('stories' as any),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const story = await ctx.db.get(args.storyId as any);
    return story;
  },
});

