"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { AlertCircle, Clock, CreditCard, MessageSquare, RefreshCcw, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";

export default function RefundPolicy() {
    return (
        <main className="min-h-screen relative" data-section-theme="light">
            <ParallaxGroup>
                {/* Background layers */}
                <ParallaxLayer asBackground speed={0.2} className="z-0">
                    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white opacity-90" />
                </ParallaxLayer>

                <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
                    <div className="fixed inset-0">
                        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff3b30] blur-[120px] -top-20 -right-20 opacity-5" />
                        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff5e54] blur-[100px] bottom-0 -left-20 opacity-5" />
                    </div>
                </ParallaxLayer>

                {/* Content layer */}
                <div className="relative z-10 container mx-auto px-4 py-32 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl font-asgard font-bold text-gray-900 mb-6">
                            Refund Policy
                        </h1>
                        <p className="text-xl text-gray-600">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </motion.div>

                    <div className="space-y-12">

                        {/* Overview */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <RefreshCcw className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Our Commitment to Quality
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        At CribNosh, we are committed to ensuring you have a great dining experience. However, we understand that sometimes things might not go as planned. This policy outlines when and how you can request a refund.
                                    </p>
                                    <p className="text-gray-600">
                                        If you are unsatisfied with your order, please contact us immediately so we can resolve the issue.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Eligibility */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <ShoppingBag className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-6">
                                        Eligibility for Refunds
                                    </h2>

                                    <div className="space-y-6">
                                        <div className="border-l-4 border-[#ff3b30] pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Missing Items</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                If an item is missing from your order, we will refund the cost of that specific item.
                                            </p>
                                        </div>

                                        <div className="border-l-4 border-blue-500 pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Incorrect Items</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                If you receive an item different from what you ordered, we will refund the cost of that item.
                                            </p>
                                        </div>

                                        <div className="border-l-4 border-green-500 pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Quality Issues</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                If the food quality is not up to reasonable standards (e.g., undercooked, spoiled), we may issue a full or partial refund. We may request photographic evidence.
                                            </p>
                                        </div>

                                        <div className="border-l-4 border-purple-500 pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Delivery Issues</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                If your order never arrives or is significantly delayed (over 45 minutes past the estimated time) without prior notification, you may be eligible for a refund.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* How to Request */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <MessageSquare className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        How to Request a Refund
                                    </h2>
                                    <ol className="list-decimal list-inside space-y-3 text-gray-600">
                                        <li><strong>Contact Support:</strong> Please contact our support team via the "Help" section in the app or email support@cribnosh.co.uk.</li>
                                        <li><strong>Timeframe:</strong> Refund requests for quality issues or missing items must be made within 24 hours of the delivery time.</li>
                                        <li><strong>Provide Details:</strong> Please include your Order ID and a description of the issue. For quality issues, photos are highly recommended and may be required.</li>
                                    </ol>
                                </div>
                            </div>
                        </motion.section>

                        {/* Refund Process */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <CreditCard className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Refund Processing
                                    </h2>
                                    <ul className="list-none space-y-3 text-gray-600">
                                        <li className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                                            <div>
                                                <strong>Method:</strong> Refunds will be processed to the original payment method used for the order.
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                                            <div>
                                                <strong>Timing:</strong> Please allow 5-10 business days for the funds to appear in your account, depending on your bank's processing times.
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </motion.section>

                        {/* Order Cancellations */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Clock className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Order Cancellations
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        You may cancel your order for a full refund if the food creator has not yet accepted the order or started preparation.
                                    </p>
                                    <p className="text-gray-600">
                                        Once the food creator has begun preparing your food, we cannot offer a full refund for cancellations. However, please contact support and we will review your case.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Statutory Rights */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <AlertCircle className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Statutory Rights
                                    </h2>
                                    <p className="text-gray-600">
                                        Nothing in this policy affects your statutory rights under the Consumer Rights Act 2015. You have the right to expect food that is of satisfactory quality, fit for purpose, and as described.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                    </div>
                </div>
            </ParallaxGroup>
        </main>
    );
}
