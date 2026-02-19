import type { Metadata } from "next";
import EdinburghLaunchContent from "./launch-content";

export const metadata: Metadata = {
    title: "CribNosh Launching in Edinburgh | Join the Food Revolution",
    description: "CribNosh is launching in Edinburgh! Join the waitlist for authentic home-cooked meals delivered to your door. Be part of the food revolution.",
    openGraph: {
        title: "CribNosh Launching in Edinburgh",
        description: "Authentic home-cooked meals coming soon to Edinburgh. Join the waitlist!",
        images: ["/images/cities/optimized/edinburgh.jpeg"],
    },
};

export default function EdinburghLaunchPage() {
    return <EdinburghLaunchContent />;
}
