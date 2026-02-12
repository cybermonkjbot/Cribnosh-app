import { MetadataRoute } from 'next';

import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

/**
 * Generates a sitemap array for the Next.js application, including main site, cities, and dynamic content.
 *
 * The sitemap entries include URLs, last modified dates, change frequency, and priority values tailored for each route group.
 * 
 * @returns An array of sitemap entries conforming to `MetadataRoute.Sitemap` for use in search engine indexing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
  let dynamicCityRoutes: MetadataRoute.Sitemap = [];
  let dynamicBlogRoutes: MetadataRoute.Sitemap = [];
  let dynamicFoodCreatorRoutes: MetadataRoute.Sitemap = [];

  if (convexUrl) {
    const convex = new ConvexHttpClient(convexUrl);

    try {
      // Fetch dynamic cities
      // @ts-ignore
      const cities = await convex.query(api.queries.cities.getCities, { status: 'active' });
      dynamicCityRoutes = cities.map((city: any) => ({
        url: `${baseUrl}/cities/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));

      // Fetch dynamic blog posts
      // @ts-ignore
      const posts = await convex.query(api.queries.blog.getBlogPosts, { status: 'published' });
      dynamicBlogRoutes = posts.map((post: any) => ({
        url: `${baseUrl}/by-us/${post.slug}`,
        lastModified: new Date(post.publishedAt || post.createdAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
      // Fetch dynamic food creator profiles
      // @ts-ignore
      const foodCreators = await convex.query(api.queries.chefs.getFoodCreatorSitemapData, {});
      dynamicFoodCreatorRoutes = foodCreators.map((creator: any) => ({
        url: `${baseUrl}/food-creator/${creator.username}`,
        lastModified: new Date(creator.updatedAt || creator._creationTime),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    } catch (error) {
      console.error('Error fetching dynamic sitemap data:', error);
      // Fallback to static lists if Convex fetch fails to ensure sitemap still generates
    }
  }

  // Fallback static city routes (in case DB fetch fails or for key landing pages)
  const staticCityRoutes = [
    '/cities', // Index page
    '/cities/birmingham',
    '/cities/leicester',
    '/cities/nottingham',
    '/cities/coventry',
    '/cities/stoke-on-trent',
    '/cities/derby',
    '/cities/wolverhampton',
    '/cities/northampton',
  ];

  const mainSitemap: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  const staticCitiesSitemap: MetadataRoute.Sitemap = staticCityRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '/cities' ? 0.7 : 0.6,
  }));

  return [...mainSitemap, ...staticCitiesSitemap, ...dynamicCityRoutes, ...dynamicBlogRoutes, ...dynamicFoodCreatorRoutes];
} 