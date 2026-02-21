import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import { Metadata } from "next";
import CuisinesClientPage from "./cuisines-client-page";

export const metadata: Metadata = {
    title: "Explore Cuisines | Authentic Homemade Meals | Cribnosh",
    description: "Discover a world of authentic homemade flavors. From Nigerian to Indian, Italian to Vegan, find your favorite cuisines cooked by local food creators.",
    alternates: {
        canonical: "https://cribnosh.com/cuisines"
    },
    openGraph: {
        title: "Explore Cuisines | Cribnosh",
        description: "Discover authentic homemade meals across different cuisines.",
        images: ["/og-image.jpg"],
        url: "https://cribnosh.com/cuisines"
    },
};

export default async function Page() {
    const convex = getConvexClient();
    let cuisines: any[] = [];

    try {
        cuisines = await convex.query(api.queries.cuisines.listApproved);
    } catch (error) {
        console.error("Error fetching cuisines:", error);
    }

    // If no cuisines in DB, provide some defaults for SEO and initial visibility
    const defaultCuisines = [
        { name: "Nigerian", description: "Authentic Jollof, Suya, and traditional soups.", image: "/images/cuisines/nigerian.jpg" },
        { name: "Indian", description: "Rich curries, biryanis, and tandoori specialties.", image: "/images/cuisines/indian.jpg" },
        { name: "Caribbean", description: "Jerk chicken, curry goat, and tropical flavors.", image: "/images/cuisines/caribbean.jpg" },
        { name: "British", description: "Classic Sunday roasts, pies, and comfort food.", image: "/images/cuisines/british.jpg" },
        { name: "Vegan", description: "Planted-based cultural meals without compromise.", image: "/images/cuisines/vegan.jpg" },
        { name: "Healthy", description: "Nutritious, balanced meals for your wellbeing.", image: "/images/cuisines/healthy.jpg" },
    ];

    const displayCuisines = cuisines.length > 0 ? cuisines : defaultCuisines;

    return (
        <CuisinesClientPage cuisines={displayCuisines} />
    );
}
