import { Metadata } from "next";
import FoundersStoryClient from "./client-page";

export const metadata: Metadata = {
    title: "Our Story",
    description: "Read the founding story of Cribnosh. Discover how Doyle Omachonu built a platform to celebrate cultural diversity through authentic family recipes.",
    keywords: "Cribnosh founder, Doyle Omachonu, Cribnosh story, cultural food startup"
};

export default function FoundersStoryPage() {
    return <FoundersStoryClient />;
}
