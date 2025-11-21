import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';

/**
 * Create a new story
 */
export const createStory = mutation({
  args: {
    title: v.string(),
    content: v.string(), // HTML content from rich text editor
    coverImage: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    tags: v.array(v.string()),
    status: v.union(v.literal('draft'), v.literal('published'), v.literal('archived')),
    publishedAt: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef profile
    const chefs = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), user._id))
      .collect();
    
    const chef = chefs[0];
    
    if (!chef && !isAdmin(user) && !isStaff(user)) {
      throw new Error('Chef profile not found');
    }

    const authorName = chef?.name || user.name || 'Unknown';
    const authorAvatar = chef?.profileImage || user.profileImage || '';

    // Generate slug
    const slug = args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existing = await ctx.db
      .query('stories')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .first();

    if (existing) {
      throw new Error('A story with this title already exists');
    }

    const now = Date.now();
    const publishDate = args.status === 'published' ? (args.publishedAt || now) : undefined;

    const storyId = await ctx.db.insert('stories', {
      slug,
      title: args.title,
      content: args.content,
      author: {
        name: authorName,
        avatar: authorAvatar,
      },
      authorName,
      categories: [],
      date: new Date(now).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      coverImage: args.coverImage,
      featuredImage: args.featuredImage,
      status: args.status,
      tags: args.tags,
      publishedAt: publishDate,
      createdAt: now,
      updatedAt: now,
    });

    return storyId;
  },
});

/**
 * Update an existing story
 */
export const updateStory = mutation({
  args: {
    storyId: v.id('stories'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal('draft'), v.literal('published'), v.literal('archived'))),
    publishedAt: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);
    const story = await ctx.db.get(args.storyId);

    if (!story) {
      throw new Error('Story not found');
    }

    // Verify ownership (chef can only update their own stories, admin/staff can update any)
    if (!isAdmin(user) && !isStaff(user)) {
      const chefs = await ctx.db
        .query('chefs')
        .filter(q => q.eq(q.field('userId'), user._id))
        .collect();
      
      const chef = chefs[0];
      if (!chef || story.authorName !== chef.name) {
        throw new Error('Access denied: You can only update your own stories');
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
      // Update slug if title changed
      const slug = args.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if new slug already exists (excluding current story)
      const existing = await ctx.db
        .query('stories')
        .withIndex('by_slug', q => q.eq('slug', slug))
        .first();
      
      if (existing && existing._id !== args.storyId) {
        throw new Error('A story with this title already exists');
      }
      
      updates.slug = slug;
    }

    if (args.content !== undefined) updates.content = args.content;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.featuredImage !== undefined) updates.featuredImage = args.featuredImage;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === 'published' && !story.publishedAt) {
        updates.publishedAt = args.publishedAt || Date.now();
      }
    }
    if (args.publishedAt !== undefined) updates.publishedAt = args.publishedAt;

    await ctx.db.patch(args.storyId, updates);

    return { success: true };
  },
});

