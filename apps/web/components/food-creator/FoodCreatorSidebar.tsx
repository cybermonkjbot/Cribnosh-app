"use client";

import { CribNoshLogo } from "@/components/ui/CribNoshLogo";
import { useFoodCreatorAuth } from "@/lib/food-creator-auth";
import { cn } from "@/lib/utils";
import {
    DollarSign,
    FileText,
    HelpCircle,
    Home,
    LogOut,
    Package,
    Settings,
    ShoppingBag,
    User,
    Video
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
    { name: "Dashboard", href: "/food-creator/dashboard", icon: Home },
    { name: "Orders", href: "/food-creator/orders", icon: ShoppingBag },
    { name: "Meals", href: "/food-creator/meals", icon: Package },
    { name: "Content", href: "/food-creator/content", icon: FileText },
    { name: "Live Streaming", href: "/food-creator/live", icon: Video },
    { name: "Earnings", href: "/food-creator/earnings", icon: DollarSign },
    { name: "Profile", href: "/food-creator/profile", icon: User },
    { name: "Settings", href: "/food-creator/settings/account-details", icon: Settings },
    { name: "Support", href: "/food-creator/support", icon: HelpCircle },
];

export function FoodCreatorSidebar() {
    const pathname = usePathname();
    const { foodCreator, user, logout } = useFoodCreatorAuth();

    return (
        <div className="flex h-full w-64 flex-col bg-[#02120A] border-r border-white/10">
            {/* Logo/Header */}
            <div className="flex h-16 items-center justify-center border-b border-white/10 px-6">
                <CribNoshLogo size={120} variant="white" />
            </div>

            {/* Food Creator Info */}
            {foodCreator && (
                <div className="border-b border-white/10 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold shadow-inner">
                            {foodCreator.name?.charAt(0) || "F"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{foodCreator.name}</p>
                            <p className="text-xs text-gray-400 truncate">{foodCreator.email}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-hide">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-[#4ADE80] text-black shadow-[0_0_15px_rgba(74,222,128,0.3)]"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-black" : "text-gray-500 group-hover:text-white")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/10 p-3">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all group"
                >
                    <LogOut className="h-5 w-5 text-gray-500 group-hover:text-white" />
                    Logout
                </button>
            </div>
        </div>
    );
}
