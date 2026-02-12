"use client";

import { useChefAuth } from "@/lib/chef-auth";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useChefAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/food-creator/sign-in");
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
            <FoodCreatorSidebar />
            <main className="flex-1 overflow-y-auto bg-slate-50">
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    <Suspense fallback={<div className="flex h-full items-center justify-center pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F23E2E]" /></div>}>
                        {children}
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
