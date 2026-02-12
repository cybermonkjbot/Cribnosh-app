"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Bell, Package, ShoppingBag, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ChefDashboard() {
    const { chef, user, sessionToken, isBasicOnboardingComplete, isOnboardingComplete } = useChefAuth();
    const [isOnline, setIsOnline] = useState(chef?.isAvailable || false);
    const toggleAvailability = useMutation(api.mutations.chefs.toggleAvailability);

    // Get recent orders
    const recentOrders = useQuery(
        api.queries.orders.listByChef,
        chef?._id && sessionToken ? { chef_id: chef._id.toString(), limit: 5, sessionToken } : "skip"
    );

    // Get chef analytics for earnings
    const analytics = useQuery(
        api.queries.analytics.getChefAnalytics,
        chef?._id && sessionToken ? { chefId: chef._id, timeRange: "30d", sessionToken } : "skip"
    );

    const stats = [
        {
            name: "Today's Orders",
            value: analytics?.todayOrders || 0,
            icon: ShoppingBag,
            color: "from-blue-500 to-blue-600",
        },
        {
            name: "This Week",
            value: analytics?.weekOrders || 0,
            icon: TrendingUp,
            color: "from-purple-500 to-purple-600",
        },
        {
            name: "This Month",
            value: analytics?.monthOrders || 0,
            icon: Package,
            color: "from-green-500 to-green-600",
        },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Food Creator Dashboard</h1>
                        <p className="mt-1 text-gray-600">Welcome back, {chef?.name || user?.name}</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-4 py-2 shadow-md hover:shadow-lg transition-all border border-gray-200">
                        <Bell className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Onboarding Notice */}
            {(!isBasicOnboardingComplete || !isOnboardingComplete) && (
                <div className="mb-6 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary p-6 text-white shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Complete Your Onboarding</h3>
                    <p className="mb-4 text-white/90">
                        {!isBasicOnboardingComplete
                            ? "Set up your profile to start receiving orders"
                            : "Complete the compliance course to activate your account"}
                    </p>
                    <Link
                        href="/food-creator/onboarding"
                        className="inline-flex items-center gap-2 rounded-lg bg-white text-brand-primary px-4 py-2 font-semibold hover:bg-gray-50 transition-all"
                    >
                        Continue Setup
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            )}

            {/* Online/Offline Toggle */}
            <div className="mb-6 rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Availability Status</h3>
                        <p className="text-sm text-gray-600">
                            {isOnline ? "You're online and can receive orders" : "You're offline"}
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            if (!chef?._id) return;
                            const newState = !isOnline;
                            setIsOnline(newState); // Optimistic update
                            try {
                                await toggleAvailability({
                                    chefId: chef._id,
                                    isAvailable: newState,
                                    sessionToken
                                });
                            } catch (error) {
                                console.error("Failed to toggle availability:", error);
                                setIsOnline(!newState); // Revert on failure
                                alert("Failed to update availability. Please try again.");
                            }
                        }}
                        className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${isOnline ? "bg-brand-secondary" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${isOnline ? "translate-x-11" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`rounded-full bg-gradient-to-br ${stat.color} p-3`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Earnings Summary */}
            <div className="mb-8 rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Revenue</p>
                        <p className="mt-2 text-4xl font-bold text-gray-900">
                            £{analytics ? (analytics.totalRevenue / 100).toFixed(2) : "0.00"}
                        </p>
                    </div>
                    <Link
                        href="/food-creator/earnings"
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-3 font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                        View Earnings
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                    {recentOrders && recentOrders.length > 0 && (
                        <Link href="/food-creator/orders" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                            View All
                        </Link>
                    )}
                </div>

                {recentOrders && recentOrders.length > 0 ? (
                    <div className="space-y-4">
                        {recentOrders.map((order: any) => (
                            <Link
                                key={order._id}
                                href={`/food-creator/orders/${order._id}`}
                                className="block rounded-lg border border-gray-200 p-4 hover:border-orange-300 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Order #{order.order_id || order._id.slice(-8)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            £{order.total_amount ? (order.total_amount / 100).toFixed(2) : "0.00"}
                                        </p>
                                        <span className="inline-block mt-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                                            {order.order_status || "pending"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No recent orders</p>
                        <p className="text-sm text-gray-500 mt-1">
                            You haven't received any orders yet. Start accepting orders to see them here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
