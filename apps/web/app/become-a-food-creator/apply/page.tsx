import { Metadata } from "next";
import CookingApplyClient from "./client-page";

export const metadata: Metadata = {
    title: "Become a Food Creator",
    description: "Turn your culinary passion into a business. Apply to become a food creator on Cribnosh, share your cultural recipes, and earn money from your kitchen.",
    keywords: "sell home cooked food UK, become a chef Cribnosh, food creator application"
};

export default function BecomeAFoodCreatorApplyPage() {
    return <CookingApplyClient />;
}
