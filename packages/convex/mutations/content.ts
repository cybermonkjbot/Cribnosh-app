// @ts-nocheck
import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { sanitizeContent } from "../../../apps/web/lib/utils/content-sanitizer";
import { requireAdmin } from "../utils/auth";

export const createContent = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("blog"), v.literal("recipe"), v.literal("page"), v.literal("article"), v.literal("guide")),
    content: v.string(),
    excerpt: v.optional(v.string()),
    author: v.string(),
    tags: v.optional(v.array(v.string())),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    featuredImage: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    // Generate slug if not provided
    const slug = args.slug || args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existing = await ctx.db
      .query("content")
      .filter((q) => q.eq(q.field("slug"), slug))
      .first();
    
    if (existing) {
      throw new Error("Slug already exists");
    }
    
    const contentId = await ctx.db.insert("content", {
      title: sanitizeContent(args.title),
      type: args.type,
      content: sanitizeContent(args.content),
      excerpt: args.excerpt ? sanitizeContent(args.excerpt) : sanitizeContent(args.content.substring(0, 160) + "..."),
      author: sanitizeContent(args.author),
      tags: args.tags || [],
      status: args.status,
      featuredImage: args.featuredImage,
      seoTitle: args.seoTitle ? sanitizeContent(args.seoTitle) : sanitizeContent(args.title),
      seoDescription: args.seoDescription ? sanitizeContent(args.seoDescription) : sanitizeContent(args.excerpt || args.content.substring(0, 160)),
      slug,
      publishDate: args.status === "published" ? Date.now() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Log the content creation
    await ctx.db.insert("adminActivity", {
      type: "content_created",
      description: `${args.type} "${args.title}" was created`,
      timestamp: Date.now(),
      metadata: {
        contentId,
        type: args.type,
        title: args.title,
        status: args.status,
      },
    });
    
    return { success: true, contentId };
  },
});

export const updateContent = mutation({
  args: {
    contentId: v.id("content"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    featuredImage: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }
    
    const updateData: {
      updatedAt: number;
      title?: string;
      content?: string;
      excerpt?: string;
      tags?: string[];
      status?: "draft" | "published" | "archived";
      publishDate?: number;
      featuredImage?: string;
      seoTitle?: string;
      seoDescription?: string;
      slug?: string;
    } = {
      updatedAt: Date.now(),
    };
    
    if (args.title !== undefined) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.excerpt !== undefined) updateData.excerpt = args.excerpt;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.status !== undefined) {
      updateData.status = args.status;
      if (args.status === "published" && content.status !== "published") {
        updateData.publishDate = Date.now();
      }
    }
    if (args.featuredImage !== undefined) updateData.featuredImage = args.featuredImage;
    if (args.seoTitle !== undefined) updateData.seoTitle = args.seoTitle;
    if (args.seoDescription !== undefined) updateData.seoDescription = args.seoDescription;
    if (args.slug !== undefined) {
      // Check if new slug already exists
      const existing = await ctx.db
        .query("content")
        .filter((q) => q.eq(q.field("slug"), args.slug))
        .first();
      
      if (existing && existing._id !== args.contentId) {
        throw new Error("Slug already exists");
      }
      updateData.slug = args.slug;
    }
    
    await ctx.db.patch(args.contentId, updateData);
    
    // Log the content update
    await ctx.db.insert("adminActivity", {
      type: "content_updated",
      description: `${content.type} "${content.title}" was updated`,
      timestamp: Date.now(),
      metadata: {
        contentId: args.contentId,
        type: content.type,
        title: content.title,
        changes: updateData,
      },
    });
    
    return { success: true };
  },
});

export const deleteContent = mutation({
  args: {
    contentId: v.id("content"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }
    
    await ctx.db.delete(args.contentId);
    
    // Log the content deletion
    await ctx.db.insert("adminActivity", {
      type: "content_deleted",
      description: `${content.type} "${content.title}" was deleted`,
      timestamp: Date.now(),
      metadata: {
        contentId: args.contentId,
        type: content.type,
        title: content.title,
      },
    });
    
    return { success: true };
  },
});

export const publishContent = mutation({
  args: {
    contentId: v.id("content"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }
    
    await ctx.db.patch(args.contentId, {
      status: "published",
      publishDate: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Log the content publication
    await ctx.db.insert("adminActivity", {
      type: "content_published",
      description: `${content.type} "${content.title}" was published`,
      timestamp: Date.now(),
      metadata: {
        contentId: args.contentId,
        type: content.type,
        title: content.title,
      },
    });
    
    return { success: true };
  },
});

export const archiveContent = mutation({
  args: {
    contentId: v.id("content"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const content = await ctx.db.get(args.contentId);
    if (!content) {
      throw new Error("Content not found");
    }
    
    await ctx.db.patch(args.contentId, {
      status: "archived",
      updatedAt: Date.now(),
    });
    
    // Log the content archival
    await ctx.db.insert("adminActivity", {
      type: "content_archived",
      description: `${content.type} "${content.title}" was archived`,
      timestamp: Date.now(),
      metadata: {
        contentId: args.contentId,
        type: content.type,
        title: content.title,
      },
    });
    
    return { success: true };
  },
});

// Additional functions needed by frontend
export const createBlogPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    author: v.string(),
    tags: v.optional(v.array(v.string())),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    featuredImage: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const slug = args.slug || args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const contentId = await ctx.db.insert("content", {
      title: sanitizeContent(args.title),
      type: "blog",
      content: sanitizeContent(args.content),
      excerpt: args.excerpt ? sanitizeContent(args.excerpt) : sanitizeContent(args.content.substring(0, 160) + "..."),
      author: sanitizeContent(args.author),
      tags: args.tags || [],
      status: args.status,
      featuredImage: args.featuredImage,
      seoTitle: args.seoTitle ? sanitizeContent(args.seoTitle) : sanitizeContent(args.title),
      seoDescription: args.seoDescription ? sanitizeContent(args.seoDescription) : sanitizeContent(args.excerpt || args.content.substring(0, 160)),
      slug,
      publishDate: args.status === "published" ? Date.now() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, contentId };
  },
});

export const updateBlogPost = mutation({
  args: {
    contentId: v.id("content"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    featuredImage: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const { contentId, ...updates } = args;
    await ctx.db.patch(contentId, {
      ...updates,
      updatedAt: Date.now(),
      ...(updates.status === "published" && { publishDate: Date.now() }),
    });
    
    return { success: true };
  },
});

export const deleteBlogPost = mutation({
  args: {
    contentId: v.id("content"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.contentId);
    return { success: true };
  },
});

export const publishBlogPost = mutation({
  args: {
    contentId: v.id("content"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.patch(args.contentId, {
      status: "published",
      publishDate: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Recipe Management Functions
export const createRecipe = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.string(),
    })),
    instructions: v.array(v.string()),
    prepTime: v.number(),
    cookTime: v.number(),
    servings: v.number(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    cuisine: v.string(),
    dietary: v.array(v.string()),
    author: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    featuredImage: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const recipeId = await ctx.db.insert("recipes", {
      title: args.title,
      description: args.description,
      ingredients: args.ingredients,
      instructions: args.instructions,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      difficulty: args.difficulty,
      cuisine: args.cuisine,
      dietary: args.dietary,
      author: args.author,
      status: args.status,
      featuredImage: args.featuredImage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, recipeId };
  },
});

export const updateRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ingredients: v.optional(v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.string(),
    }))),
    instructions: v.optional(v.array(v.string())),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    servings: v.optional(v.number()),
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    )),
    cuisine: v.optional(v.string()),
    dietary: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
    featuredImage: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const { recipeId, ...updates } = args;
    await ctx.db.patch(recipeId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.recipeId);
    return { success: true };
  },
});

export const publishRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.patch(args.recipeId, {
      status: "published",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Static Page Management Functions
export const createStaticPage = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    author: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    parentPage: v.optional(v.id("staticPages")),
    isHomepage: v.boolean(),
    isContact: v.boolean(),
    isAbout: v.boolean(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const slug = args.slug || args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const pageId = await ctx.db.insert("staticPages", {
      title: args.title,
      content: args.content,
      excerpt: args.excerpt || args.content.substring(0, 160) + "...",
      author: args.author,
      status: args.status,
      parentPage: args.parentPage,
      isHomepage: args.isHomepage,
      isContact: args.isContact,
      isAbout: args.isAbout,
      metaTitle: args.metaTitle || args.title,
      metaDescription: args.metaDescription || args.excerpt || args.content.substring(0, 160),
      slug,
      publishDate: args.status === "published" ? Date.now() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, pageId };
  },
});

export const updateStaticPage = mutation({
  args: {
    pageId: v.id("staticPages"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
    parentPage: v.optional(v.id("staticPages")),
    isHomepage: v.optional(v.boolean()),
    isContact: v.optional(v.boolean()),
    isAbout: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    const { pageId, ...updates } = args;
    await ctx.db.patch(pageId, {
      ...updates,
      updatedAt: Date.now(),
      ...(updates.status === "published" && { publishDate: Date.now() }),
    });

    return { success: true };
  },
});

export const deleteStaticPage = mutation({
  args: {
    pageId: v.id("staticPages"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.pageId);
    return { success: true };
  },
});

export const publishStaticPage = mutation({
  args: {
    pageId: v.id("staticPages"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Require admin authentication
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.patch(args.pageId, {
      status: "published",
      publishDate: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
