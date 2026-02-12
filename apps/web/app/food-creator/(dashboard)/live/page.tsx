"use client";

import { Clock, Users, Video } from "lucide-react";

export default function LivePage() {
    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Live Streaming</h1>
                <p className="mt-1 text-gray-600">Connect with customers through live cooking sessions</p>
            </div>

            {/* Go Live Card */}
            <div className="mb-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-8 text-white shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-3">Ready to Go Live?</h2>
                        <p className="text-white/90 mb-6 max-w-md">
                            Start a live cooking session and engage with your customers in real-time. Take orders while you cook!
                        </p>
                        <button className="bg-white text-purple-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-50 transition-all shadow-lg inline-flex items-center gap-2">
                            <Video className="h-5 w-5" />
                            Start Live Session
                        </button>
                    </div>
                    <Video className="h-24 w-24 opacity-20" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Video className="h-6 w-6 text-purple-600" />
                        <p className="text-sm font-medium text-gray-600">Total Streams</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="h-6 w-6 text-blue-600" />
                        <p className="text-sm font-medium text-gray-600">Total Viewers</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-6 w-6 text-green-600" />
                        <p className="text-sm font-medium text-gray-600">Hours Streamed</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
            </div>

            {/* Stream History */}
            <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Stream History</h2>
                <div className="text-center py-12">
                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No streams yet</h3>
                    <p className="text-gray-600 mb-6">Start your first live session to engage with customers</p>
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Go Live Now
                    </button>
                </div>
            </div>
        </div>
    );
}
