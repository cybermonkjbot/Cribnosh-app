"use client";

import { MessageCircle, Send } from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (message.trim()) {
            // TODO: Implement send message
            console.log("Sending message:", message);
            setMessage("");
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Support</h1>
                <p className="mt-1 text-gray-600">Get help from our support team</p>
            </div>

            <div className="max-w-4xl mx-auto">
                {/* Chat Container */}
                <div className="rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-white/20 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="h-6 w-6" />
                            <div>
                                <h2 className="font-semibold">CribNosh Support</h2>
                                <p className="text-sm opacity-90">We're here to help</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="space-y-4">
                            {/* Welcome Message */}
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                    S
                                </div>
                                <div className="flex-1">
                                    <div className="bg-gray-100 rounded-lg p-4 inline-block max-w-md">
                                        <p className="text-gray-900">
                                            Hello! Welcome to CribNosh support. How can we help you today?
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Just now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!message.trim()}
                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold p-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Help */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/80 backdrop-blur-sm p-4 shadow-md border border-white/20">
                        <h3 className="font-semibold text-gray-900 mb-2">Common Questions</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="hover:text-orange-600 cursor-pointer">• How do I update my menu?</li>
                            <li className="hover:text-orange-600 cursor-pointer">• When will I receive my payout?</li>
                            <li className="hover:text-orange-600 cursor-pointer">• How do I handle refunds?</li>
                        </ul>
                    </div>
                    <div className="rounded-lg bg-white/80 backdrop-blur-sm p-4 shadow-md border border-white/20">
                        <h3 className="font-semibold text-gray-900 mb-2">Need Urgent Help?</h3>
                        <p className="text-sm text-gray-600 mb-3">Call our support line</p>
                        <a href="tel:+441234567890" className="text-orange-600 font-semibold hover:text-orange-700">
                            +44 123 456 7890
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
