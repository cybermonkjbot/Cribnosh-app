"use client";

import { useChefAuth } from "@/lib/chef-auth";
import { Bell, Lock, Shield, User } from "lucide-react";
import { useState } from "react";

export default function AccountDetailsPage() {
    const { chef, user } = useChefAuth();
    const [notifications, setNotifications] = useState({
        orderUpdates: true,
        payouts: true,
        marketing: false,
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Account Details</h1>
                <p className="mt-1 text-gray-400">Manage your account settings and preferences</p>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Account Information */}
                <div className="rounded-xl bg-white/5 backdrop-blur-sm p-6 shadow-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <User className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Account Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Account ID</p>
                            <p className="mt-1 text-white font-mono text-sm">{chef?._id || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Registered Email</p>
                            <p className="mt-1 text-white">{user?.email || chef?.email || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Account Status</p>
                            <span className="mt-1 inline-flex items-center rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-500/30">
                                Active
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">Member Since</p>
                            <p className="mt-1 text-white">
                                {chef?._creationTime ? new Date(chef._creationTime).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="rounded-xl bg-white/5 backdrop-blur-sm p-6 shadow-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                            <Bell className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-white">Order Updates</p>
                                <p className="text-sm text-gray-400">Receive alerts for new orders and status changes</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, orderUpdates: !notifications.orderUpdates })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.orderUpdates ? "bg-[#4ADE80]" : "bg-white/10"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.orderUpdates ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-white">Payout Notifications</p>
                                <p className="text-sm text-gray-400">Get notified when payouts are processed</p>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, payouts: !notifications.payouts })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.payouts ? "bg-[#4ADE80]" : "bg-white/10"}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.payouts ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="rounded-xl bg-white/5 backdrop-blur-sm p-6 shadow-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                            <Shield className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Security</h2>
                    </div>

                    <button className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all border border-white/10">
                        <Lock className="h-4 w-4" />
                        Change Password
                    </button>
                </div>
            </div>
        </div>
    );
}
