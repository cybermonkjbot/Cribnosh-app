import { Metadata } from "next";
import CookiePolicyClient from "./client-page";

export const metadata: Metadata = {
    title: "Cookie Policy",
    description: "Read the Cribnosh Cookie Policy to understand how we use cookies and similar technologies to improve your experience."
};

export default function CookiePolicyPage() {
    return <CookiePolicyClient />;
}
