import { Metadata } from "next";
// import { motion } from "motion/react"; // We'll need a client wrapper for motion parts if we want metadata
import LocationClientPage from "./client-page";

type Props = {
    params: { city: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

// Helper to format city name
function formatCityName(cityParam: string): string {
    return cityParam
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { city: rawCity } = await params;
    const city = formatCityName(rawCity);

    return {
        title: `Homemade Food Delivery in ${city} | Authentic Cultural Meals`,
        description: `Order authentic homemade meals in ${city}. Connect with local ${city} food creators cooking family recipes. Nigerian, Indian, Caribbean and more delivered to your door in ${city}.`,
        alternates: {
            canonical: `https://cribnosh.com/locations/${rawCity}`
        },
        openGraph: {
            title: `Homemade Food Delivery in ${city} | Cribnosh`,
            description: `Experience authentic cultural home cooking in ${city}.`,
            images: ['/og-image.jpg'], // Fallback or dynamic
            url: `https://cribnosh.com/locations/${rawCity}`
        },
        keywords: [
            `${city} food delivery`,
            `home cooked meals ${city}`,
            `authentic food ${city}`,
            `Nigerian food ${city}`,
            `Indian food ${city}`,
            `food creators ${city}`,
            `food creator jobs ${city}`,
            "Cribnosh"
        ]
    };
}

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";

export default async function Page({ params }: Props) {
    const { city: cityParam } = await params;
    const city = formatCityName(cityParam);
    const convex = getConvexClient();

    let foodCreators: any[] = [];
    try {
        // @ts-ignore
        foodCreators = await convex.query(api.queries.chefs.getFoodCreatorsByCity, { city, limit: 6 });
    } catch (error) {
        console.error("Error fetching food creators for city:", city, error);
    }

    // Create ItemList Schema for food creators
    const creatorItemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": foodCreators.map((creator, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Person",
                "name": creator.name,
                "url": `https://cribnosh.com/food-creator/${creator.username || creator.userId}`, // Use username if available
                "image": creator.profileImage,
                "jobTitle": "Food Creator"
            }
        }))
    };

    return (
        <>
            {/* JSON-LD for LocalBusiness / ServiceArea */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "serviceType": "Meal Delivery",
                        "areaServed": {
                            "@type": "City",
                            "name": city
                        },
                        "provider": {
                            "@type": "Organization",
                            "name": "Cribnosh",
                            "url": "https://cribnosh.com"
                        },
                        "description": `Connecting ${city} food lovers with local food creators.`
                    })
                }}
            />
            {foodCreators.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(creatorItemListSchema)
                    }}
                />
            )}
            {/* BreadcrumbList Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Home",
                                "item": "https://cribnosh.com"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "Locations",
                                "item": "https://cribnosh.com/all-cities"
                            },
                            {
                                "@type": "ListItem",
                                "position": 3,
                                "name": city,
                                "item": `https://cribnosh.com/locations/${cityParam}`
                            }
                        ]
                    })
                }}
            />
            <LocationClientPage city={city} foodCreators={foodCreators} />
        </>
    );
}
