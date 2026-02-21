import { Metadata } from "next";
import ContactClient from "./client-page";

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Get in touch with the Cribnosh team. We're here to help with support, partnerships, or any other inquiries."
};

export default function ContactPage() {
    return <ContactClient />;
}
