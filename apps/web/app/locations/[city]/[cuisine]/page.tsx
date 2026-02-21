import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import { Metadata } from "next";
import LocationCuisineClientPage from "./client-page";

type Props = {
    params: { city: string; cuisine: string };
};

function formatName(name: string): string {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { city: cityParam, cuisine: cuisineParam } = await params;
    const city = formatName(cityParam);
    const cuisine = formatName(cuisineParam);

    return {
        title: `Best ${cuisine} Food in ${city} | Homemade Delivery | Cribnosh`,
        description: `Order the best authentic homemade ${cuisine} food in ${city}. Connected with local ${city} food creators cooking traditional ${cuisine} family recipes.`,
        alternates: {
            canonical: `https://cribnosh.com/locations/${cityParam}/${cuisineParam}`
        },
        keywords: [
            `${cuisine} food ${city}`,
            `${city} ${cuisine} delivery`,
            `home cooked ${cuisine} ${city}`,
            `best ${cuisine} in ${city}`,
            "Cribnosh"
        ]
    };
}

export default async function Page({ params }: Props) {
    const { city: cityParam, cuisine: cuisineParam } = await params;
    const city = formatName(cityParam);
    const cuisine = formatName(cuisineParam);
    const convex = getConvexClient();

    let foodCreators: any[] = [];
    try {
        // We'll need a new query or filter existing ones for this
        // For now, let's try to get creators by city and we can filter by cuisine in the client or a specialized query
        // @ts-ignore
        foodCreators = await convex.query(api.queries.chefs.getFoodCreatorsByCity, { city });

        // Simple client-side filtering for now if necessary, though a server-side query is better
        if (cuisineParam !== 'all') {
            foodCreators = foodCreators.filter((creator: any) =>
                creator.specialties?.some((s: string) => s.toLowerCase() === cuisine.toLowerCase())
            );
        }
    } catch (error) {
        console.error("Error fetching food creators for city/cuisine:", city, cuisine, error);
    }

    return (
        <LocationCuisineClientPage
            city={city}
            cuisine={cuisine}
            foodCreators={foodCreators}
            cityParam={cityParam}
            cuisineParam={cuisineParam}
        />
    );
}
