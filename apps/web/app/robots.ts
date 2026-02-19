import { MetadataRoute } from 'next';

/**
 * Generates robots.txt rules and sitemap location for web crawlers.
 *
 * @returns An object specifying allowed and disallowed paths for user agents and the sitemap URL.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/locations', '/locations/*'],
      disallow: ['/admin/*'],
    },
    sitemap: 'https://cribnosh.com/sitemap.xml',
  };
} 