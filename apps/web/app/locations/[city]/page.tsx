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
    const city = formatCityName(params.city);

    return {
        title: `Homemade Food Delivery in ${city} | Authentic Cultural Meals | Cribnosh`,
        description: `Order authentic homemade meals in ${city}. Connect with local ${city} chefs cooking family recipes. Nigerian, Indian, Caribbean and more delivered to your door in ${city}.`,
        openGraph: {
            title: `Homemade Food Delivery in ${city} | Cribnosh`,
            description: `Experience authentic cultural home cooking in ${city}.`,
            images: ['/og-image.jpg'], // Fallback or dynamic
        },
        keywords: [
            `${city} food delivery`,
            `home cooked meals ${city}`,
            `authentic food ${city}`,
            `Nigerian food ${city}`,
            `Indian food ${city}`,
            `food creators ${city}`,
            `chef jobs ${city}`,
            "Cribnosh"
        ]
    };
}

export default function Page({ params }: Props) {
    const city = formatCityName(params.city);

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
                            "name": "Cribnosh"
                        },
                        "description": `Connecting ${city} food lovers with local home chefs.`
                    })
                }}
            />
            <LocationClientPage city={city} />
        </>
    );
}
