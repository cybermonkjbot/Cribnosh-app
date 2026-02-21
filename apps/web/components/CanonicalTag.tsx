"use client";

import { usePathname } from 'next/navigation';

export function CanonicalTag() {
    const pathname = usePathname();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

    // In client components, we can't easily access headers, so we rely on env or window.location
    // But since this is a canonical tag, it's mostly for SEO (server-side).
    // The server-side portion is now handled in layout.tsx via generateMetadata.

    // For client-side updates if any:
    const domain = baseUrl.replace(/\/$/, '');
    const currentPath = pathname || '/';
    const canonical = `${domain}${currentPath}`;

    return (
        <link rel="canonical" href={canonical} />
    );
}
