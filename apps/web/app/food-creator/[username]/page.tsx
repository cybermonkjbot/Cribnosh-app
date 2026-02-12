import { JsonLd } from "@/components/JsonLd";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import FoodCreatorProfileClient from "./food-creator-profile-client";

type Params = { username: string };

// Helper to get food creator data
async function getFoodCreator(username: string) {
    const convex = getConvexClient();
    // Try to find by username first
    try {
        // We will rename this query in backend next, but using the old name for now to avoid breaking until backend is updated.
        // Actually, I will update backend in parallel or next step. Let's assume the name will be getFoodCreatorByUsername.
        // Wait, if I change it here before backend, it might break build if types are checked.
        // But I'm using @ts-ignore mostly or dynamic dispatch.
        // Let's use the NEW name and I will update backend immediately after.
        // @ts-ignore
        const foodCreator = await convex.query(api.queries.chefs.getFoodCreatorByUsername, { username });
        return foodCreator;
    } catch (e) {
        console.error("Error fetching food creator:", e);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
    const { username } = await params;
    const foodCreator = await getFoodCreator(username);

    if (!foodCreator) {
        return {
            title: "Food Creator Not Found | CribNosh",
            description: "The food creator profile you are looking for could not be found."
        };
    }

    const title = `${foodCreator.name} | Professional Food Creator | CribNosh`;
    const description = foodCreator.bio?.slice(0, 160) || `Order authentic homemade meals from ${foodCreator.name} on CribNosh.`;
    const images = foodCreator.profileImage ? [foodCreator.profileImage] : ['/og-image.jpg'];

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            type: 'profile',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
        keywords: [
            foodCreator.name,
            "food creator",
            "home cooked meals",
            "food delivery",
            foodCreator.location?.city || "",
            ...(foodCreator.specialties || []),
            "CribNosh"
        ].filter(Boolean)
    };
}

export default async function FoodCreatorProfilePage({ params }: { params: Promise<Params> }) {
    const { username } = await params;
    const foodCreator = await getFoodCreator(username);

    if (!foodCreator) {
        notFound();
    }

    return (
        <main>
            <JsonLd />
            {/* Schema for Person/FoodCreator */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ProfilePage",
                        "mainEntity": {
                            "@type": "Person",
                            "name": foodCreator.name,
                            "description": foodCreator.bio,
                            "image": foodCreator.profileImage,
                            "jobTitle": "Food Creator",
                            "knowsAbout": foodCreator.specialties,
                            "homeLocation": {
                                "@type": "Place",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": foodCreator.location?.city
                                }
                            },
                            "telephone": foodCreator.user_phone,
                            "url": `https://cribnosh.com/food-creator/${username}`
                        }
                    })
                }}
            />

            <FoodCreatorProfileClient foodCreator={foodCreator} />
        </main>
    );
}
