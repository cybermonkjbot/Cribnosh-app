import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { sanitizeContent } from "../../../apps/web/lib/utils/content-sanitizer";

export const createBlogPost = mutation({
  args: {
    title: v.string(),
    content: v.string(), // Rich HTML/JSON from editor
    excerpt: v.string(),
    body: v.optional(v.array(v.string())), // Paragraphs array
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      paragraphs: v.optional(v.array(v.string())),
      bullets: v.optional(v.array(v.string())),
      checklist: v.optional(v.array(v.string())),
      proTips: v.optional(v.array(v.string())),
      callout: v.optional(v.object({
        variant: v.union(v.literal("note"), v.literal("warning"), v.literal("tip")),
        text: v.string()
      })),
      image: v.optional(v.string()),
      imageAlt: v.optional(v.string()),
      video: v.optional(v.string()),
      videoThumbnail: v.optional(v.string())
    }))),
    headings: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string()
    }))),
    author: v.object({
      name: v.string(),
      avatar: v.string()
    }),
    categories: v.array(v.string()),
    date: v.string(), // Format: "August 2025"
    coverImage: v.optional(v.string()), // Convex storage URL
    featuredImage: v.optional(v.string()), // Convex storage URL
    tags: v.optional(v.array(v.string())),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    categoryId: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Generate slug if not provided
    const slug = args.slug || args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();
    
    if (existing) {
      throw new Error("Slug already exists");
    }
    
    // Sanitize content
    const sanitizedTitle = sanitizeContent(args.title);
    const sanitizedContent = sanitizeContent(args.content);
    const sanitizedExcerpt = sanitizeContent(args.excerpt);
    
    // Sanitize body paragraphs if provided
    const sanitizedBody = args.body ? args.body.map((p: string) => sanitizeContent(p)) : undefined;
    
    // Sanitize sections if provided
    const sanitizedSections = args.sections ? args.sections.map((section: any) => ({
      ...section,
      title: sanitizeContent(section.title),
      paragraphs: section.paragraphs ? section.paragraphs.map((p: string) => sanitizeContent(p)) : section.paragraphs,
      bullets: section.bullets ? section.bullets.map((b: string) => sanitizeContent(b)) : section.bullets,
      checklist: section.checklist ? section.checklist.map((c: string) => sanitizeContent(c)) : section.checklist,
      proTips: section.proTips ? section.proTips.map((t: string) => sanitizeContent(t)) : section.proTips,
      callout: section.callout ? {
        ...section.callout,
        text: sanitizeContent(section.callout.text)
      } : section.callout,
    })) : undefined;
    
    // Sanitize headings if provided
    const sanitizedHeadings = args.headings ? args.headings.map((h: any) => ({
      ...h,
      text: sanitizeContent(h.text)
    })) : undefined;
    
    // Sanitize author
    const sanitizedAuthor = {
      name: sanitizeContent(args.author.name),
      avatar: args.author.avatar
    };
    
    const postId = await ctx.db.insert("blogPosts", {
      title: sanitizedTitle,
      slug,
      content: sanitizedContent,
      excerpt: sanitizedExcerpt,
      body: sanitizedBody,
      sections: sanitizedSections,
      headings: sanitizedHeadings,
      author: sanitizedAuthor,
      authorName: sanitizedAuthor.name, // For indexing
      categories: args.categories || [],
      date: args.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      coverImage: args.coverImage,
      featuredImage: args.featuredImage,
      tags: args.tags || [],
      status: args.status,
      categoryId: args.categoryId,
      seoTitle: args.seoTitle ? sanitizeContent(args.seoTitle) : sanitizedTitle,
      seoDescription: args.seoDescription ? sanitizeContent(args.seoDescription) : sanitizedExcerpt,
      publishedAt: args.status === "published" ? Date.now() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, postId };
  },
});

export const updateBlogPost = mutation({
  args: {
    postId: v.id("blogPosts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    body: v.optional(v.array(v.string())),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      paragraphs: v.optional(v.array(v.string())),
      bullets: v.optional(v.array(v.string())),
      checklist: v.optional(v.array(v.string())),
      proTips: v.optional(v.array(v.string())),
      callout: v.optional(v.object({
        variant: v.union(v.literal("note"), v.literal("warning"), v.literal("tip")),
        text: v.string()
      })),
      image: v.optional(v.string()),
      imageAlt: v.optional(v.string()),
      video: v.optional(v.string()),
      videoThumbnail: v.optional(v.string())
    }))),
    headings: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string()
    }))),
    author: v.optional(v.object({
      name: v.string(),
      avatar: v.string()
    })),
    categories: v.optional(v.array(v.string())),
    date: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    categoryId: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const { postId, ...updates } = args;
    
    // Build update object
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    // Handle slug change
    if (updates.slug) {
      // Check if new slug already exists (excluding current post)
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q: any) => q.eq("slug", updates.slug))
        .first();
      
      if (existing && existing._id !== postId) {
        throw new Error("Slug already exists");
      }
      updateData.slug = updates.slug;
    }
    
    // Handle title
    if (updates.title !== undefined) {
      updateData.title = sanitizeContent(updates.title);
    }
    
    // Handle content
    if (updates.content !== undefined) {
      updateData.content = sanitizeContent(updates.content);
    }
    
    // Handle excerpt
    if (updates.excerpt !== undefined) {
      updateData.excerpt = sanitizeContent(updates.excerpt);
    }
    
    // Handle body
    if (updates.body !== undefined) {
      updateData.body = updates.body ? updates.body.map((p: string) => sanitizeContent(p)) : updates.body;
    }
    
    // Handle sections
    if (updates.sections !== undefined) {
      updateData.sections = updates.sections ? updates.sections.map((section: any) => ({
        ...section,
        title: sanitizeContent(section.title),
        paragraphs: section.paragraphs ? section.paragraphs.map((p: string) => sanitizeContent(p)) : section.paragraphs,
        bullets: section.bullets ? section.bullets.map((b: string) => sanitizeContent(b)) : section.bullets,
        checklist: section.checklist ? section.checklist.map((c: string) => sanitizeContent(c)) : section.checklist,
        proTips: section.proTips ? section.proTips.map((t: string) => sanitizeContent(t)) : section.proTips,
        callout: section.callout ? {
          ...section.callout,
          text: sanitizeContent(section.callout.text)
        } : section.callout,
      })) : updates.sections;
    }
    
    // Handle headings
    if (updates.headings !== undefined) {
      updateData.headings = updates.headings ? updates.headings.map((h: any) => ({
        ...h,
        text: sanitizeContent(h.text)
      })) : updates.headings;
    }
    
    // Handle author
    if (updates.author !== undefined) {
      updateData.author = {
        name: sanitizeContent(updates.author.name),
        avatar: updates.author.avatar
      };
      updateData.authorName = sanitizeContent(updates.author.name); // Update index field
    }
    
    // Handle categories
    if (updates.categories !== undefined) {
      updateData.categories = updates.categories;
    }
    
    // Handle date
    if (updates.date !== undefined) {
      updateData.date = updates.date;
    }
    
    // Handle images
    if (updates.coverImage !== undefined) {
      updateData.coverImage = updates.coverImage;
    }
    if (updates.featuredImage !== undefined) {
      updateData.featuredImage = updates.featuredImage;
    }
    
    // Handle tags
    if (updates.tags !== undefined) {
      updateData.tags = updates.tags;
    }
    
    // Handle status
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === "published") {
        updateData.publishedAt = Date.now();
      }
    }
    
    // Handle categoryId
    if (updates.categoryId !== undefined) {
      updateData.categoryId = updates.categoryId;
    }
    
    // Handle SEO fields
    if (updates.seoTitle !== undefined) {
      updateData.seoTitle = updates.seoTitle ? sanitizeContent(updates.seoTitle) : updates.seoTitle;
    }
    if (updates.seoDescription !== undefined) {
      updateData.seoDescription = updates.seoDescription ? sanitizeContent(updates.seoDescription) : updates.seoDescription;
    }
    
    await ctx.db.patch(postId, updateData);
    
    return { success: true };
  },
});

export const deleteBlogPost = mutation({
  args: {
    postId: v.id("blogPosts"),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.postId);
    return { success: true };
  },
});

export const publishBlogPost = mutation({
  args: {
    postId: v.id("blogPosts"),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.postId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const archiveBlogPost = mutation({
  args: {
    postId: v.id("blogPosts"),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.postId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Internal mutation for seeding - bypasses auth
export const createBlogPostForSeed = internalMutation({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.string(),
    body: v.optional(v.array(v.string())),
    author: v.object({
      name: v.string(),
      avatar: v.string(),
    }),
    categories: v.array(v.string()),
    date: v.string(),
    coverImage: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    )),
  },
  returns: v.id("blogPosts"),
  handler: async (ctx, args) => {
    const slug = args.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const now = Date.now();
    
    const postId = await ctx.db.insert("blogPosts", {
      title: args.title,
      slug,
      content: args.content,
      excerpt: args.excerpt,
      body: args.body,
      sections: undefined,
      headings: undefined,
      author: args.author,
      authorName: args.author.name,
      categories: args.categories,
      date: args.date,
      coverImage: args.coverImage,
      featuredImage: args.featuredImage,
      tags: args.tags || [],
      status: args.status || "published",
      categoryId: undefined,
      seoTitle: args.title,
      seoDescription: args.excerpt,
      publishedAt: args.status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return postId;
  },
});

