"use client";

import { usePathname } from 'next/navigation';

export function CanonicalTag() {
    const pathname = usePathname();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';

    // Ensure we handle trailing slash or double slash if needed
    // Usually pathname starts with / and baseUrl shouldn't have trailing slash
    const domain = baseUrl.replace(/\/$/, '');

    // If pathname is null (shouldn't happen usually), fallback
    const currentPath = pathname || '/';

    const canonical = `${domain}${currentPath}`;
    const altUk = `https://cribnosh.co.uk${currentPath}`;
    const altCom = canonical;

    return (
        <>
            <link rel="canonical" href={canonical} />
            <link rel="alternate" href={altCom} hrefLang="en" />
            <link rel="alternate" href={altUk} hrefLang="en-gb" />
            <link rel="alternate" href={altCom} hrefLang="x-default" />
        </>
    );
}
