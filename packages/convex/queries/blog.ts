import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser, isAdmin } from "../utils/auth";

export const getBlogPosts = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Check if user is admin or content owner
    const user = await getAuthenticatedUser(ctx, args.sessionToken);
    const isUserAdmin = user ? isAdmin(user) : false;

    // Get chef for content owner check (if user is a chef)
    let chef = null;
    if (user) {
      chef = await ctx.db
        .query("chefs")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .first();
    }

    // Default to 'published' status for customer-facing queries
    // Only return all statuses if explicitly requested (for admin/chef views)
    const status = args.status || 'published';
    let posts;
    if (status === 'all' && (isUserAdmin || chef)) {
      // Fetch all posts if status='all' AND user is admin or chef
      posts = await ctx.db.query("blogPosts")
        .collect();
    } else if (status === 'all') {
      // If status='all' but user is not admin/chef, default to published
      posts = await ctx.db.query("blogPosts")
        .withIndex("by_status", (q: any) => q.eq("status", "published"))
        .collect();
    } else {
      // Filter by the specified status (defaults to 'published')
      posts = await ctx.db.query("blogPosts")
        .withIndex("by_status", (q: any) => q.eq("status", status))
        .collect();
    }

    // If user is not admin, filter to only show their own content or published content
    if (!isUserAdmin && chef) {
      posts = posts.filter((post: any) =>
        post.status === 'published' || post.author?.name === chef.name
      );
    } else if (!isUserAdmin) {
      // Non-admin, non-chef users only see published content
      posts = posts.filter((post: any) => post.status === 'published');
    }

    // Filter by category if provided
    if (args.category) {
      posts = posts.filter((post: any) =>
        post.categories && post.categories.includes(args.category)
      );
    }

    // Search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      posts = posts.filter((post: any) =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.excerpt?.toLowerCase().includes(searchLower) ||
        post.author.name.toLowerCase().includes(searchLower) ||
        post.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }


    // Sort by published date (most recent first)
    posts.sort((a: any, b: any) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return dateB - dateA;
    });

    // Apply limit if provided
    if (args.limit) {
      posts = posts.slice(0, args.limit);
    }

    // Convert storage IDs to URLs
    const postsWithUrls = await Promise.all(
      posts.map(async (post: any) => {
        const coverImageUrl = post.coverImage
          ? (typeof post.coverImage === 'string' && post.coverImage.startsWith('http')
            ? post.coverImage
            : await ctx.storage.getUrl(post.coverImage as any).catch(() => null))
          : null;

        const featuredImageUrl = post.featuredImage
          ? (typeof post.featuredImage === 'string' && post.featuredImage.startsWith('http')
            ? post.featuredImage
            : await ctx.storage.getUrl(post.featuredImage as any).catch(() => null))
          : null;

        return {
          _id: post._id,
          title: post.title,
          slug: post.slug,
          status: post.status as 'draft' | 'published' | 'archived',
          author: post.author,
          content: post.content,
          excerpt: post.excerpt,
          body: post.body,
          sections: post.sections,
          headings: post.headings,
          categories: post.categories || [],
          date: post.date,
          coverImage: coverImageUrl,
          featuredImage: featuredImageUrl,
          tags: post.tags || [],
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          // Removed expensive per-post analytics for list view
          videoId: post.videoId,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
        };
      })
    );

    return postsWithUrls;
  },
});

export const getBlogPostBySlug = query({
  args: {
    slug: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();

    if (!post) {
      return null;
    }

    // Check if user is admin or content owner
    const user = await getAuthenticatedUser(ctx, args.sessionToken);
    const isUserAdmin = user ? isAdmin(user) : false;

    // Get chef for content owner check
    let chef = null;
    if (user) {
      chef = await ctx.db
        .query("chefs")
        .withIndex("by_user", (q: any) => q.eq("userId", user._id))
        .first();
    }

    const isContentOwner = chef && post.author?.name === chef.name;

    // Allow access if: published, OR user is admin, OR user is content owner
    if (post.status !== 'published' && !isUserAdmin && !isContentOwner) {
      return null;
    }

    // Get analytics data
    const viewCount = await ctx.db
      .query("contentViews")
      .filter((q: any) => q.eq(q.field("contentId"), post._id))
      .collect()
      .then((views: any[]) => views.length);

    const likeCount = await ctx.db
      .query("contentLikes")
      .filter((q: any) => q.eq(q.field("contentId"), post._id))
      .collect()
      .then((likes: any[]) => likes.length);

    const commentCount = await ctx.db
      .query("contentComments")
      .filter((q: any) => q.eq(q.field("contentId"), post._id))
      .collect()
      .then((comments: any[]) => comments.length);

    return {
      _id: post._id,
      title: post.title,
      slug: post.slug,
      status: post.status as 'draft' | 'published' | 'archived',
      author: post.author,
      content: post.content,
      excerpt: post.excerpt,
      body: post.body,
      sections: post.sections,
      headings: post.headings,
      categories: post.categories || [],
      date: post.date,
      coverImage: post.coverImage,
      featuredImage: post.featuredImage,
      tags: post.tags || [],
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      viewCount,
      likeCount,
      commentCount,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    };
  },
});

export const getBlogPostById = query({
  args: {
    postId: v.id("blogPosts"),
  },
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db.get(args.postId);

    if (!post) {
      return null;
    }

    // Get analytics data
    const viewCount = await ctx.db
      .query("contentViews")
      .filter((q: any) => q.eq(q.field("contentId"), post._id))
      .collect()
      .then((views: any[]) => views.length);

    const likeCount = await ctx.db
      .query("contentLikes")
      .filter((q: any) => q.eq(q.field("contentId"), post._id))
      .collect()
      .then((likes: any[]) => likes.length);

    const commentCount = await ctx.db
      .query("contentComments")
      .filter((q: any) => q.eq(q.field("contentId"), post._id))
      .collect()
      .then((comments: any[]) => comments.length);

    // Convert storage IDs to URLs
    const coverImageUrl = post.coverImage
      ? (typeof post.coverImage === 'string' && post.coverImage.startsWith('http')
        ? post.coverImage
        : await ctx.storage.getUrl(post.coverImage as any).catch(() => null))
      : null;

    const featuredImageUrl = post.featuredImage
      ? (typeof post.featuredImage === 'string' && post.featuredImage.startsWith('http')
        ? post.featuredImage
        : await ctx.storage.getUrl(post.featuredImage as any).catch(() => null))
      : null;

    return {
      _id: post._id,
      title: post.title,
      slug: post.slug,
      status: post.status as 'draft' | 'published' | 'archived',
      author: post.author,
      content: post.content,
      excerpt: post.excerpt,
      body: post.body,
      sections: post.sections,
      headings: post.headings,
      categories: post.categories || [],
      date: post.date,
      coverImage: coverImageUrl,
      featuredImage: featuredImageUrl,
      tags: post.tags || [],
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      viewCount,
      likeCount,
      commentCount,
      videoId: post.videoId,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      categoryId: post.categoryId,
    };
  },
});

export const getBlogCategories = query({
  args: {},
  handler: async (ctx: any) => {
    const posts = await ctx.db.query("blogPosts")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .collect();

    // Extract all unique categories
    const categorySet = new Set<string>();
    posts.forEach((post: any) => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((cat: string) => categorySet.add(cat));
      }
    });

    return Array.from(categorySet).sort();
  },
});

export const getFeaturedBlogPost = query({
  args: {},
  handler: async (ctx: any) => {
    // Get the most recent published post as featured
    const posts = await ctx.db.query("blogPosts")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .order("desc")
      .collect();

    if (posts.length === 0) {
      return null;
    }

    // Sort by publishedAt or createdAt
    posts.sort((a: any, b: any) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return dateB - dateA;
    });

    const post = posts[0];

    // Convert storage IDs to URLs
    const coverImageUrl = post.coverImage
      ? (typeof post.coverImage === 'string' && post.coverImage.startsWith('http')
        ? post.coverImage
        : await ctx.storage.getUrl(post.coverImage as any).catch(() => null))
      : null;

    const featuredImageUrl = post.featuredImage
      ? (typeof post.featuredImage === 'string' && post.featuredImage.startsWith('http')
        ? post.featuredImage
        : await ctx.storage.getUrl(post.featuredImage as any).catch(() => null))
      : null;

    return {
      _id: post._id,
      title: post.title,
      slug: post.slug,
      status: post.status as 'draft' | 'published' | 'archived',
      author: post.author,
      content: post.content,
      excerpt: post.excerpt,
      body: post.body,
      sections: post.sections,
      headings: post.headings,
      categories: post.categories || [],
      date: post.date,
      coverImage: coverImageUrl,
      featuredImage: featuredImageUrl,
      tags: post.tags || [],
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    };
  },
});

