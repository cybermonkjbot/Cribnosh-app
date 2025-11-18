import { v } from "convex/values";
import { query } from "../_generated/server";

export const getBlogPosts = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    // For admin views, fetch all posts if no status filter is provided
    // Otherwise filter by the specified status
    let posts;
    if (args.status) {
      posts = await ctx.db.query("blogPosts")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .collect();
    } else {
      // Fetch all posts when no status filter is provided (for admin panel)
      posts = await ctx.db.query("blogPosts")
        .collect();
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
    
    // Get analytics data for blog posts
    const postsWithAnalytics = await Promise.all(
      posts.map(async (post: any) => {
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
        };
      })
    );

    return postsWithAnalytics;
  },
});

export const getBlogPostBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();
    
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

