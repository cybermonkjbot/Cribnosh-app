import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

/**
 * Generates a sitemap array for the Next.js application, including main site and city-specific routes.
 *
 * The sitemap entries include URLs, last modified dates, change frequency, and priority values tailored for each route group.
 * 
 * @returns An array of sitemap entries conforming to `MetadataRoute.Sitemap` for use in search engine indexing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Main routes
  const routes = [
    '',
    '/about',
    '/all-cities',
    '/careers',
    '/certification',
    '/compliance',
    '/contact',
    '/cooking',
    '/cooking/apply',
    '/driving/apply',
    '/early-access-perks',
    '/features',
    '/manifesto',
    '/privacy',
    '/terms',
    '/try-it',
    '/values/cultural-roots',
    '/values/family-traditions',
    '/values/healthy-choices',
    '/values/hygienic-standards',
    '/values/sustainable-practices',
    '/values/vibrant-flavors',
    '/waitlist',
    '/work-with-cribnosh',
  ];

  // City routes
  const cityRoutes = [
    '/cities',
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

  const citiesSitemap: MetadataRoute.Sitemap = cityRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '/cities' ? 0.7 : 0.6,
  }));

  return [...mainSitemap, ...citiesSitemap];
} 