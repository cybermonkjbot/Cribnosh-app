import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import { Metadata } from "next";
import CreatorsClientPage from "./creators-client-page";

export const metadata: Metadata = {
    title: "Meet Our Food Creators | Artisanal Homemade Meals | Cribnosh",
    description: "Discover the talented individuals behind your favorite homemade meals. Meet our certified food creators, explore their stories, and taste their passion.",
    alternates: {
        canonical: "https://cribnosh.com/creators"
    },
    openGraph: {
        title: "Meet Our Food Creators | Cribnosh",
        description: "Connect with local food creators cooking authentic family recipes.",
        images: ["/og-image.jpg"],
        url: "https://cribnosh.com/creators"
    },
};

export default async function Page() {
    const convex = getConvexClient();
    let foodCreators: any[] = [];

    try {
        foodCreators = await convex.query(api.queries.foodCreators.getAll, { limit: 20 });
    } catch (error) {
        console.error("Error fetching food creators:", error);
    }

    return (
        <CreatorsClientPage creators={foodCreators} />
    );
}
