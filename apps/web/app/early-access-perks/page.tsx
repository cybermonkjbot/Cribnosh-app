import { Metadata } from "next";
import EarlyAccessClient from "./client-page";

export const metadata: Metadata = {
    title: "Early Access Perks",
    description: "Join the Cribnosh early access program to unlock exclusive perks, discounts, and be the first to experience our cultural meal platform."
};

export default function EarlyAccessPage() {
    return <EarlyAccessClient />;
}
