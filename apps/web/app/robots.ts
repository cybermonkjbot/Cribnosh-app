import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

/**
 * Generates robots.txt rules and sitemap location for web crawlers.
 *
 * @returns An object specifying allowed and disallowed paths for user agents and the sitemap URL.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || 'cribnosh.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/*',
        '/food-creator/sign-in',
        '/checkout',
        '/cart',
        '/api/*'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
