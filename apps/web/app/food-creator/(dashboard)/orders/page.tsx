"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useQuery } from "convex/react";
import { Search, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    confirmed: { bg: "bg-blue-100", text: "text-blue-800" },
    preparing: { bg: "bg-purple-100", text: "text-purple-800" },
    ready: { bg: "bg-green-100", text: "text-green-800" },
    completed: { bg: "bg-green-100", text: "text-green-800" },
    cancelled: { bg: "bg-red-100", text: "text-red-800" },
};

export default function OrdersPage() {
    const { chef, sessionToken } = useChefAuth();
    const [filter, setFilter] = useState<"all" | "active" | "today">("active");
    const [searchQuery, setSearchQuery] = useState("");

    const orders = useQuery(
        api.queries.orders.listByChef,
        chef?._id && sessionToken
            ? { chef_id: chef._id.toString(), limit: 50, sessionToken }
            : "skip"
    );

    const filteredOrders = orders?.filter((order: any) => {
        // Apply status filter
        if (filter === "active") {
            const activeStatuses = ["pending", "confirmed", "preparing", "ready"];
            if (!activeStatuses.includes(order.order_status?.toLowerCase())) return false;
        } else if (filter === "today") {
            const today = new Date().setHours(0, 0, 0, 0);
            const orderDate = new Date(order.createdAt).setHours(0, 0, 0, 0);
            if (orderDate !== today) return false;
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const orderId = (order.order_id || order._id).toLowerCase();
            return orderId.includes(query);
        }

        return true;
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
                <p className="mt-1 text-gray-600">Manage and track your orders</p>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by order ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition bg-white/80 backdrop-blur-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("active")}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${filter === "active"
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                            : "bg-white/80 text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter("today")}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${filter === "today"
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                            : "bg-white/80 text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${filter === "all"
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                            : "bg-white/80 text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        All
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders && filteredOrders.length > 0 ? (
                    filteredOrders.map((order: any) => {
                        const status = order.order_status?.toLowerCase() || "pending";
                        const statusStyle = statusColors[status] || statusColors.pending;

                        return (
                            <Link
                                key={order._id}
                                href={`/food-creator/orders/${order._id}`}
                                className="block rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20 hover:shadow-lg hover:border-orange-300 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Order #{order.order_id || order._id.slice(-8)}
                                            </h3>
                                            <span
                                                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                                            >
                                                {status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">
                                            £{order.total_amount ? (order.total_amount / 100).toFixed(2) : "0.00"}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="text-center py-16 rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-white/20">
                        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Food Creator orders found</h3>
                        <p className="text-gray-600">
                            {filter === "active"
                                ? "You don't have any active orders at the moment."
                                : filter === "today"
                                    ? "You haven't received any orders today."
                                    : "You haven't received any orders yet."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
