"use client";

import { api } from "@/convex/_generated/api";
import { useChefAuth } from "@/lib/chef-auth";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    confirmed: { bg: "bg-blue-100", text: "text-blue-800" },
    preparing: { bg: "bg-purple-100", text: "text-purple-800" },
    ready: { bg: "bg-green-100", text: "text-green-800" },
    completed: { bg: "bg-green-100", text: "text-green-800" },
    cancelled: { bg: "bg-red-100", text: "text-red-800" },
};

export default function OrderDetailPage() {
    const params = useParams();
    const { sessionToken } = useChefAuth();
    const orderId = params.id as string;

    const order = useQuery(
        api.queries.orders.getById,
        orderId && sessionToken ? { orderId: orderId as any } : "skip"
    );
    const updateStatus = useMutation(api.mutations.orders.updateStatus);

    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!order || !order.order_id) return;
        setIsUpdating(true);
        try {
            await updateStatus({
                order_id: order.order_id,
                status: newStatus
            });
            // Optional: Show toast
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!order) {
        return (
            <div className="p-8">
                <div className="text-center py-16">
                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    const status = order.order_status?.toLowerCase() || "pending";
    const statusStyle = statusColors[status] || statusColors.pending;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/chef/orders"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Orders
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Order #{order.order_id || order._id.slice(-8)}
                        </h1>
                        <p className="mt-1 text-gray-600">
                            {new Date(order.createdAt || Date.now()).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                    <span
                        className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                    >
                        {status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700">{order.customer_phone || "N/A"}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-gray-700">{order.delivery_address || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
                        <div className="space-y-3">
                            {order.items?.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.name || "Item"}</p>
                                        <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                        £{item.price ? (item.price / 100).toFixed(2) : "0.00"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Special Instructions */}
                    {order.special_instructions && (
                        <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h2>
                            <p className="text-gray-700">{order.special_instructions}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal</span>
                                <span>£{order.subtotal ? (order.subtotal / 100).toFixed(2) : "0.00"}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Delivery</span>
                                <span>£{order.delivery_fee ? (order.delivery_fee / 100).toFixed(2) : "0.00"}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-lg">
                                <span>Total</span>
                                <span>£{order.total_amount ? (order.total_amount / 100).toFixed(2) : "0.00"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {status === "pending" && (
                        <div className="space-y-3">
                            <button
                                onClick={() => handleStatusUpdate('confirmed')}
                                disabled={isUpdating}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                                Accept Order
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('cancelled')}
                                disabled={isUpdating}
                                className="w-full bg-white/80 text-red-600 font-semibold py-3 px-6 rounded-lg hover:bg-red-50 transition-all border border-red-300 disabled:opacity-50"
                            >
                                Reject Order
                            </button>
                        </div>
                    )}

                    {status !== "pending" && status !== "completed" && status !== "cancelled" && (
                        <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h3>
                            <select
                                value={status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                disabled={isUpdating}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:opacity-50"
                            >
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="completed">Completed</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Change status to inform the customer about their order progress.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
