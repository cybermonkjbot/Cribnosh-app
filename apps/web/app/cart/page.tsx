import { Metadata } from "next";
import CartClientPage from "./client-page";

export const metadata: Metadata = {
    title: "Your Cart | CribNosh",
    robots: {
        index: false,
        follow: false,
    },
};

export default function CartPage() {
    return <CartClientPage />;
}
