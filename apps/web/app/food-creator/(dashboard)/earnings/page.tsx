"use client";

import { api } from "@/convex/_generated/api";
import { useFoodCreatorAuth } from "@/lib/food-creator-auth";
import { useQuery } from "convex/react";
import { ArrowRight, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function EarningsPage() {
    const { foodCreator, sessionToken } = useFoodCreatorAuth();

    const analytics = useQuery(
        api.queries.analytics.getChefAnalytics,
        foodCreator?._id && sessionToken ? { chefId: foodCreator._id, timeRange: "30d", sessionToken } : "skip"
    );

    const earningsSummary = useQuery(
        api.queries.chefEarnings.getSummary,
        foodCreator?._id && sessionToken ? { chefId: foodCreator._id, sessionToken } : "skip"
    );

    const transactions = useQuery(
        api.queries.chefEarnings.getTransactions,
        foodCreator?._id && sessionToken ? { chefId: foodCreator._id, limit: 10, sessionToken } : "skip"
    );

    const availableBalance = earningsSummary?.availableBalance || 0;
    const pendingPayouts = earningsSummary?.pendingPayouts || 0;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
                <p className="mt-1 text-gray-600">Track your revenue and request payouts</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-8 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium opacity-90">Available Balance</h2>
                        <DollarSign className="h-8 w-8 opacity-80" />
                    </div>
                    <p className="text-5xl font-bold mb-6">£{(availableBalance / 100).toFixed(2)}</p>
                    <Link
                        href="/food-creator/earnings/payouts"
                        className="inline-flex items-center gap-2 bg-white text-green-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all shadow-lg"
                    >
                        Request Payout
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-8 shadow-md border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-gray-700">Pending Payouts</h2>
                        <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-6">£{(pendingPayouts / 100).toFixed(2)}</p>
                    <Link
                        href="/food-creator/earnings/payouts"
                        className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700"
                    >
                        View Payout History
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                    <p className="text-sm font-medium text-gray-600 mb-2">This Month</p>
                    <p className="text-3xl font-bold text-gray-900">
                        £{analytics ? ((analytics.monthRevenue || 0) / 100).toFixed(2) : "0.00"}
                    </p>
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                    <p className="text-sm font-medium text-gray-600 mb-2">This Week</p>
                    <p className="text-3xl font-bold text-gray-900">
                        £{analytics ? ((analytics.weekRevenue || 0) / 100).toFixed(2) : "0.00"}
                    </p>
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                    <p className="text-sm font-medium text-gray-600 mb-2">All Time</p>
                    <p className="text-3xl font-bold text-gray-900">
                        £{analytics ? ((analytics.totalRevenue || 0) / 100).toFixed(2) : "0.00"}
                    </p>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                    <Link
                        href="/food-creator/earnings/transactions"
                        className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                    >
                        View All
                    </Link>
                </div>

                {transactions && transactions.length > 0 ? (
                    <div className="space-y-4">
                        {transactions.map((transaction: any, index: number) => (
                            <div
                                key={index}
                                className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900">{transaction.description || "Order Payment"}</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(transaction.date || transaction.createdAt || Date.now()).toLocaleDateString("en-GB", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <p className={`text-lg font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {transaction.amount > 0 ? "+" : ""}£{Math.abs(transaction.amount / 100).toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No Food Creator transactions yet</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/food-creator/earnings/transactions"
                    className="flex items-center justify-between rounded-lg bg-white/80 backdrop-blur-sm p-4 shadow-md border border-white/20 hover:shadow-lg hover:border-orange-300 transition-all"
                >
                    <span className="font-semibold text-gray-900">View All Transactions</span>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>
                <Link
                    href="/food-creator/earnings/taxes"
                    className="flex items-center justify-between rounded-lg bg-white/80 backdrop-blur-sm p-4 shadow-md border border-white/20 hover:shadow-lg hover:border-orange-300 transition-all"
                >
                    <span className="font-semibold text-gray-900">Tax Information</span>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>
                <Link
                    href="/food-creator/earnings/bank-accounts"
                    className="flex items-center justify-between rounded-lg bg-white/80 backdrop-blur-sm p-4 shadow-md border border-white/20 hover:shadow-lg hover:border-orange-300 transition-all"
                >
                    <span className="font-semibold text-gray-900">Bank Accounts</span>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                </Link>
            </div>
        </div>
    );
}
