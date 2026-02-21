import { Metadata } from "next";
import CareersClient from "./client-page";

export const metadata: Metadata = {
    title: "Careers at Cribnosh",
    description: "Passionate about food, culture, and tech? Explore career opportunities at Cribnosh and help us revolutionize the meal delivery industry.",
    keywords: "Cribnosh jobs, food tech careers, startup jobs UK"
};

export default function CareersPage() {
    return <CareersClient />;
}
