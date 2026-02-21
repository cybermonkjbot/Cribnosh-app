import { Metadata } from "next";
import FeaturesClient from "./client-page";

export const metadata: Metadata = {
    title: "Cribnosh Features",
    description: "Explore the features of the Cribnosh app. Discover personalized meal recommendations, diverse cuisines, and our vibrant community of food creators.",
    keywords: "Cribnosh app features, personalized meal delivery, food creator marketplace app"
};

export default function FeaturesPage() {
    return <FeaturesClient />;
}
