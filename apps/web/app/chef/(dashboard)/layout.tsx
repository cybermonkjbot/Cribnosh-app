"use client";

import { ChefSidebar } from "@/components/chef/ChefSidebar";
import { useChefAuth } from "@/lib/chef-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useChefAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/chef/sign-in");
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#02120A]">
                <div className="text-center">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#4ADE80] border-t-transparent mx-auto"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <ChefSidebar />
            <main className="flex-1 overflow-y-auto bg-[#02120A] text-white">
                {children}
            </main>
        </div>
    );
}
