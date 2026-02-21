import { Metadata } from "next";
import DashboardClientLayout from "./client-layout";

export const metadata: Metadata = {
    title: "Food Creator Dashboard | CribNosh",
    robots: {
        index: false,
        follow: false,
    },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
