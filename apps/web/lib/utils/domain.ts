import { headers } from 'next/headers';

export const DOMAINS = {
    COM: 'https://cribnosh.com',
    UK: 'https://cribnosh.co.uk',
};

export const DEFAULT_DOMAIN = DOMAINS.COM;

/**
 * Gets the current base URL based on the request host header.
 * Falls back to NEXT_PUBLIC_BASE_URL or cribnosh.com.
 */
export async function getBaseUrlFromHeaders(): Promise<string> {
    const headersList = await headers();
    const host = headersList.get('host');

    if (host?.includes('cribnosh.co.uk')) {
        return DOMAINS.UK;
    }

    if (host?.includes('cribnosh.com')) {
        return DOMAINS.COM;
    }

    // Fallback for development/preview environments
    return process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_DOMAIN;
}

/**
 * Gets all regional domain alternates for a given path.
 */
export async function getAlternateUrls(path: string = '') {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = await getBaseUrlFromHeaders();

    return {
        canonical: `${baseUrl}${cleanPath}`,
        languages: {
            'en-GB': `${DOMAINS.UK}${cleanPath}`,
            'en-US': `${DOMAINS.COM}${cleanPath}`,
            'en': `${DOMAINS.COM}${cleanPath}`,
            'x-default': `${DOMAINS.COM}${cleanPath}`,
        },
    };
}
