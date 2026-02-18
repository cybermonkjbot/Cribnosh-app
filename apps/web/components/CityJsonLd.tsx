import { BreadcrumbList, Place, WithContext } from "schema-dts";

interface CityJsonLdProps {
    cityName: string;
    description?: string;
    image?: string;
}

export function CityJsonLd({ cityName, description, image }: CityJsonLdProps) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com';
    const citySlug = cityName.toLowerCase().replace(/ /g, '-');
    const cityUrl = `${baseUrl}/cities/${citySlug}`;

    const placeSchema: WithContext<Place> = {
        "@context": "https://schema.org",
        "@type": "Place",
        name: cityName,
        description: description || `Experience authentic home-cooked meals in ${cityName} with CribNosh.`,
        url: cityUrl,
        image: image || `${baseUrl}/og-cities.jpg`,
        address: {
            "@type": "PostalAddress",
            addressLocality: cityName,
            addressRegion: cityName.toLowerCase() === 'edinburgh' ? "Scotland" : "West Midlands", // Handle Scotland for Edinburgh, default to Midlands for others
            addressCountry: "GB"
        },
        geo: {
            "@type": "GeoCoordinates",
            // Approximate coords will be better than nothing, but maybe skip if unknown.
            // For simplicity we'll omit specific lat/long here to avoid inaccuracy unless we hardcode map.
            // Google checks address mainly.
            addressCountry: "GB"
        }
    };

    const breadcrumbSchema: WithContext<BreadcrumbList> = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: baseUrl
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Cities",
                item: `${baseUrl}/cities`
            },
            {
                "@type": "ListItem",
                position: 3,
                name: cityName,
                item: cityUrl
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
        </>
    );
}
