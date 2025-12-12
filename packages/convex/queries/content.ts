import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireStaff } from "../utils/auth";

export const getContentItems = query({
  args: {
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let content = await ctx.db.query("content").collect();

    if (args.type) {
      content = content.filter((item: any) => item.type === args.type);
    }

    if (args.status) {
      content = content.filter((item: any) => item.status === args.status);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      content = content.filter((item: any) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.content?.toLowerCase().includes(searchLower) ||
        item.author.toLowerCase().includes(searchLower)
      );
    }

    // Get real analytics data for all content items
    const contentWithAnalytics = await Promise.all(
      content.map(async (item: any) => {
        // Get view count from contentViews table
        const viewCount = await ctx.db
          .query("contentViews")
          .filter((q: any) => q.eq(q.field("contentId"), item._id))
          .collect()
          .then((views: any[]) => views.length);

        // Get like count from contentLikes table
        const likeCount = await ctx.db
          .query("contentLikes")
          .filter((q: any) => q.eq(q.field("contentId"), item._id))
          .collect()
          .then((likes: any[]) => likes.length);

        // Get comment count from contentComments table
        const commentCount = await ctx.db
          .query("contentComments")
          .filter((q: any) => q.eq(q.field("contentId"), item._id))
          .collect()
          .then((comments: any[]) => comments.length);

        return {
          _id: item._id,
          title: item.title,
          type: item.type as 'blog' | 'recipe' | 'page' | 'article' | 'guide',
          status: item.status as 'draft' | 'published' | 'archived',
          author: item.author,
          content: item.content,
          excerpt: item.excerpt,
          tags: item.tags || [],
          publishDate: item.publishDate,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          viewCount,
          likeCount,
          commentCount,
          featuredImage: item.featuredImage,
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          slug: item.slug
        };
      })
    );

    return contentWithAnalytics;
  },
});

export const getContentStats = query({
  args: {},
  handler: async (ctx: any) => {
    const content = await ctx.db.query("content").collect();
    const published = content.filter((item: any) => item.status === 'published').length;
    const draft = content.filter((item: any) => item.status === 'draft').length;
    const archived = content.filter((item: any) => item.status === 'archived').length;

    const byType = content.reduce((acc: any, item: any) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: content.length,
      published,
      draft,
      archived,
      byType
    };
  },
});

export const getBlogPosts = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let posts = await ctx.db.query("content")
      .filter((q: any) => q.eq(q.field("type"), "blog"))
      .collect();

    if (args.status) {
      posts = posts.filter((post: any) => post.status === args.status);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      posts = posts.filter((post: any) =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.author.toLowerCase().includes(searchLower)
      );
    }

    // Get real analytics data for blog posts
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

        return {
          _id: post._id,
          title: post.title,
          status: post.status as 'draft' | 'published' | 'archived',
          author: post.author,
          content: post.content,
          excerpt: post.excerpt,
          tags: post.tags || [],
          publishDate: post.publishDate,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          viewCount,
          likeCount,
          commentCount,
          featuredImage: post.featuredImage,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          slug: post.slug
        };
      })
    );

    return postsWithAnalytics;
  },
});

export const getRecipes = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    let recipes = await ctx.db.query("content")
      .filter((q: any) => q.eq(q.field("type"), "recipe"))
      .collect();

    if (args.status) {
      recipes = recipes.filter((recipe: any) => recipe.status === args.status);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      recipes = recipes.filter((recipe: any) =>
        recipe.title.toLowerCase().includes(searchLower) ||
        recipe.content?.toLowerCase().includes(searchLower) ||
        recipe.author.toLowerCase().includes(searchLower)
      );
    }

    // Get real analytics data for recipes
    const recipesWithAnalytics = await Promise.all(
      recipes.map(async (recipe: any) => {
        const viewCount = await ctx.db
          .query("contentViews")
          .filter((q: any) => q.eq(q.field("contentId"), recipe._id))
          .collect()
          .then((views: any[]) => views.length);

        const likeCount = await ctx.db
          .query("contentLikes")
          .filter((q: any) => q.eq(q.field("contentId"), recipe._id))
          .collect()
          .then((likes: any[]) => likes.length);

        const commentCount = await ctx.db
          .query("contentComments")
          .filter((q: any) => q.eq(q.field("contentId"), recipe._id))
          .collect()
          .then((comments: any[]) => comments.length);

        return {
          _id: recipe._id,
          title: recipe.title,
          status: recipe.status as 'draft' | 'published' | 'archived',
          author: recipe.author,
          content: recipe.content,
          excerpt: recipe.excerpt,
          tags: recipe.tags || [],
          publishDate: recipe.publishDate,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
          viewCount,
          likeCount,
          commentCount,
          featuredImage: recipe.featuredImage,
          seoTitle: recipe.seoTitle,
          seoDescription: recipe.seoDescription,
          slug: recipe.slug,
          prepTime: recipe.prepTime || 30,
          cookTime: recipe.cookTime || 45,
          servings: recipe.servings || 4,
          difficulty: recipe.difficulty || 'medium' as 'easy' | 'medium' | 'hard',
          cuisine: recipe.cuisine || 'American'
        };
      })
    );

    return recipesWithAnalytics;
  },
});

export const getStaticPages = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: any, args: any) => {
    await requireStaff(ctx, args.sessionToken);

    let pages = await ctx.db.query("content")
      .filter((q: any) => q.eq(q.field("type"), "page"))
      .collect();

    if (args.status) {
      pages = pages.filter((page: any) => page.status === args.status);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      pages = pages.filter((page: any) =>
        page.title.toLowerCase().includes(searchLower) ||
        page.content?.toLowerCase().includes(searchLower) ||
        page.author.toLowerCase().includes(searchLower)
      );
    }

    // Get real analytics data for static pages
    const pagesWithAnalytics = await Promise.all(
      pages.map(async (page: any) => {
        const viewCount = await ctx.db
          .query("contentViews")
          .filter((q: any) => q.eq(q.field("contentId"), page._id))
          .collect()
          .then((views: any[]) => views.length);

        const likeCount = await ctx.db
          .query("contentLikes")
          .filter((q: any) => q.eq(q.field("contentId"), page._id))
          .collect()
          .then((likes: any[]) => likes.length);

        const commentCount = await ctx.db
          .query("contentComments")
          .filter((q: any) => q.eq(q.field("contentId"), page._id))
          .collect()
          .then((comments: any[]) => comments.length);

        return {
          _id: page._id,
          title: page.title,
          status: page.status as 'draft' | 'published' | 'archived',
          author: page.author,
          content: page.content,
          excerpt: page.excerpt,
          tags: page.tags || [],
          publishDate: page.publishDate,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
          viewCount,
          likeCount,
          commentCount,
          featuredImage: page.featuredImage,
          seoTitle: page.seoTitle,
          seoDescription: page.seoDescription,
          slug: page.slug,
          isHomepage: page.slug === 'home',
          isContact: page.slug === 'contact',
          isAbout: page.slug === 'about'
        };
      })
    );

    return pagesWithAnalytics;
  },
});

// Additional functions needed by frontend
export const getBlogCategories = query({
  args: {},
  handler: async (ctx: any) => {
    return [
      { id: '1', name: 'Food & Culture', slug: 'food-culture', postCount: 12 },
      { id: '2', name: 'Chef Stories', slug: 'chef-stories', postCount: 8 },
      { id: '3', name: 'Recipes', slug: 'recipes', postCount: 25 },
      { id: '4', name: 'Health & Nutrition', slug: 'health-nutrition', postCount: 15 },
      { id: '5', name: 'Industry News', slug: 'industry-news', postCount: 6 },
    ];
  },
});

export const getCuisines = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any) => {
    return [
      'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai', 'French', 'Mediterranean',
      'American', 'Korean', 'Vietnamese', 'Lebanese', 'Greek', 'Spanish', 'German', 'British'
    ];
  },
});

export const getRecipeCategories = query({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: any) => {
    return [
      'Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Soups', 'Salads', 'Breakfast',
      'Lunch', 'Dinner', 'Snacks', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
      'Low-Carb', 'High-Protein', 'Quick & Easy', 'One-Pot', 'Grilled', 'Baked'
    ];
  },
});
