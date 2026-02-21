import { Metadata } from "next";
import DataProtectionClient from "./client-page";

export const metadata: Metadata = {
    title: "Data Protection",
    description: "Learn how Cribnosh protects your personal data and privacy. Read our Data Protection Policy."
};

export default function DataProtectionPage() {
    return <DataProtectionClient />;
}
