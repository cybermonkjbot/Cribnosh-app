"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { Cookie, Info, Lock, Settings, ToggleLeft } from "lucide-react";
import { motion } from "motion/react";

export default function CookiePolicy() {
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
                            Cookie Policy
                        </h1>
                        <p className="text-xl text-gray-600">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </motion.div>

                    <div className="space-y-12">

                        {/* Introduction */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Info className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        What are Cookies?
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                                    </p>
                                    <p className="text-gray-600">
                                        We use cookies to distinguish you from other users of our Platform. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Cookie Categories */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Cookie className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-6">
                                        Types of Cookies We Use
                                    </h2>

                                    <div className="space-y-6">
                                        <div className="border-l-4 border-[#ff3b30] pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Strictly Necessary Cookies</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart, or make use of e-billing services.
                                            </p>
                                        </div>

                                        <div className="border-l-4 border-blue-500 pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Analytical/Performance Cookies</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.
                                            </p>
                                        </div>

                                        <div className="border-l-4 border-green-500 pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Functionality Cookies</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                These are used to recognize you when you return to our website. This enables us to personalize our content for you, greet you by name, and remember your preferences (for example, your choice of language or region).
                                            </p>
                                        </div>

                                        <div className="border-l-4 border-purple-500 pl-4">
                                            <h3 className="text-lg font-bold text-gray-900">Targeting Cookies</h3>
                                            <p className="text-gray-600 text-sm mt-1">
                                                These cookies record your visit to our website, the pages you have visited, and the links you have followed. We may share this information with third parties for this purpose.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Specific Cookie Inventory */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <Settings className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900">
                                        Cookie Inventory
                                    </h2>
                                    <p className="text-gray-600 mt-2">
                                        A list of third-party providers that may set cookies when you use our Platform:
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="py-3 px-4 text-sm font-bold text-gray-900 bg-gray-50/50">Provider</th>
                                            <th className="py-3 px-4 text-sm font-bold text-gray-900 bg-gray-50/50">Purpose</th>
                                            <th className="py-3 px-4 text-sm font-bold text-gray-900 bg-gray-50/50">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">Stripe</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">Payment processing and fraud prevention.</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">Necessary</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">Convex</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">User authentication and session management.</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">Necessary</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">Google Analytics</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">Website traffic analysis and performance monitoring.</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">Performance</td>
                                        </tr>
                                        <tr className="border-b border-gray-100">
                                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">Mapbox/Google Maps</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">Displaying maps and location services.</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">Functionality</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </motion.section>

                        {/* Managing Cookies */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <ToggleLeft className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Managing Your Cookie Preferences
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        You can block cookies by activating the setting on your browser that allows you to refuse the setting of all or some cookies. However, if you use your browser settings to block all cookies (including essential cookies), you may not be able to access all or parts of our site.
                                    </p>
                                    <p className="text-gray-600 mb-4">
                                        To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-[#ff3b30] hover:underline">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-[#ff3b30] hover:underline">www.allaboutcookies.org</a>.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Contact */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Lock className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Contact Us
                                    </h2>
                                    <p className="text-gray-600">
                                        If you have any questions about our use of cookies, please contact our Data Protection Officer at <a href="mailto:privacy@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">privacy@cribnosh.co.uk</a>.
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
