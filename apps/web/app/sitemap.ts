import { getBaseUrlFromHeaders } from '@/lib/utils/domain';
import { MetadataRoute } from 'next';

import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

/**
 * Generates a sitemap array for the Next.js application, including main site, cities, and dynamic content.
 *
 * The sitemap entries include URLs, last modified dates, change frequency, and priority values tailored for each route group.
 * 
 * @returns An array of sitemap entries conforming to `MetadataRoute.Sitemap` for use in search engine indexing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrlFromHeaders();
  // Main routes
  const routes = [
    '',
    '/about',
    '/all-cities',
    '/by-us',
    '/careers',
    '/certification',
    '/compliance',
    '/contact',
    '/cookie-policy',
    '/cooking',
    '/cooking/apply',
    '/data-protection',
    '/driving/apply',
    '/early-access-perks',
    '/features',
    '/founders-story',
    '/history',
    '/manifesto',
    '/modern-slavery-statement',
    '/privacy',
    '/referral/landing',
    '/refund-policy',
    '/terms',
    '/try-it',
    '/us-on-social-media',
    '/values/cultural-roots',
    '/values/family-traditions',
    '/values/healthy-choices',
    '/values/hygienic-standards',
    '/values/sustainable-practices',
    '/values/vibrant-flavors',
    '/waitlist',
    '/work-with-cribnosh',
  ];

  // Initialize Convex Client
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  let dynamicBlogRoutes: MetadataRoute.Sitemap = [];
  let dynamicFoodCreatorRoutes: MetadataRoute.Sitemap = [];
  let dynamicCityRoutes: MetadataRoute.Sitemap = [];
  let dynamicStoryRoutes: MetadataRoute.Sitemap = [];

  if (convexUrl) {
    const convex = new ConvexHttpClient(convexUrl);

    try {
      // Fetch dynamic blog posts
      // @ts-ignore
      const posts = await convex.query(api.queries.blog.getBlogPosts, { status: 'published' });
      dynamicBlogRoutes = (posts || []).map((post: any) => ({
        url: `${baseUrl}/by-us/${post.slug}`,
        lastModified: new Date(post.publishedAt || post.createdAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));

      // Fetch dynamic food creator profiles
      // @ts-ignore
      const foodCreators = await convex.query(api.queries.chefs.getFoodCreatorSitemapData, {});
      dynamicFoodCreatorRoutes = (foodCreators || []).map((creator: any) => ({
        url: `${baseUrl}/food-creator/${creator.username}`,
        lastModified: new Date(creator.updatedAt || creator._creationTime || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

      // Fetch unique cities for location pages
      // @ts-ignore
      const cities = await convex.query(api.queries.chefs.getAllChefLocations, {});
      const uniqueCities = Array.from(new Set((cities || []).map((c: any) => c.city.toLowerCase().replace(/\s+/g, '-'))));
      dynamicCityRoutes = uniqueCities.map((citySlug) => ({
        url: `${baseUrl}/locations/${citySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

      // Note: We don't have a specific "getStories" sitemap query yet, 
      // but we can add placeholders or use blog posts if they share the same logic.
      // For now, let's prioritize locations and blogs which are definite.
    } catch (error) {
      console.error('Error fetching dynamic sitemap data:', error);
      // Fallback to static lists if Convex fetch fails to ensure sitemap still generates
    }
  }

  const mainSitemap: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return [
    ...mainSitemap,
    ...dynamicBlogRoutes,
    ...dynamicFoodCreatorRoutes,
    ...dynamicCityRoutes,
    ...dynamicStoryRoutes
  ];
}