import { Metadata } from "next";
import CheckoutClientPage from "./client-page";

export const metadata: Metadata = {
    title: "Checkout | CribNosh",
    robots: {
        index: false,
        follow: false,
    },
};

export default function CheckoutPage() {
    return <CheckoutClientPage />;
}
