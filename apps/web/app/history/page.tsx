import { Metadata } from "next";
import HistoryClient from "./client-page";

export const metadata: Metadata = {
    title: "The Cribnosh Journey",
    description: "Take a look back at the history and milestones of Cribnosh. See how we've grown our community of food creators and foodies across the UK."
};

export default function HistoryPage() {
    return <HistoryClient />;
}
