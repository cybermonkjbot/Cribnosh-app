"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { Cookie, Info, Settings, Shield } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

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
                        <h1 className="text-4xl md:text-5xl font-asgard font-bold text-gray-900 mb-6">
                            Cookie Policy
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We believe in being transparent about how we use your data. This policy explains what cookies are, how we use them, and your choices regarding their use.
                        </p>
                    </motion.div>

                    <div className="space-y-12">

                        {/* 1. What are cookies */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Cookie className="w-8 h-8 text-[#ff3b30] shrink-0" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        What are Cookies?
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.
                                    </p>
                                    <p className="text-gray-600">
                                        Some cookies are temporary "session" cookies that are erased when you close your browser. Others are "persistent" cookies that remain on your device until they expire or you delete them.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* 2. How we use them */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Info className="w-8 h-8 text-[#ff3b30] shrink-0" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        How We Use Cookies
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        We use cookies for several reasons, detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without ensuring the complete functionality and features they add to this site.
                                    </p>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Essential Cookies</h3>
                                            <p className="text-gray-600">
                                                These are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as logging in, setting your privacy preferences, or filling in forms.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Performance & Analytics Cookies</h3>
                                            <p className="text-gray-600">
                                                These allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Functionality Cookies</h3>
                                            <p className="text-gray-600">
                                                These enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* 3. Managing Cookies */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Settings className="w-8 h-8 text-[#ff3b30] shrink-0" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Managing Your Cookie Preferences
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        You can change your cookie preferences at any time by clicking the "Cookie Settings" button in the footer of our website. You can then adjust the available sliders to 'On' or 'Off', then clicking 'Save and close'. You may need to refresh your page for your settings to take effect.
                                    </p>
                                    <p className="text-gray-600 mb-6">
                                        Alternatively, most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-[#ff3b30] hover:underline">www.aboutcookies.org</a> or <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-[#ff3b30] hover:underline">www.allaboutcookies.org</a>.
                                    </p>

                                    <div className="flex justify-center mt-8">
                                        <button
                                            onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
                                            className="bg-[#ff3b30] text-white px-6 py-3 rounded-full font-medium hover:bg-[#ff5e54] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                                        >
                                            Update Cookie Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* 4. Contact */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Shield className="w-8 h-8 text-[#ff3b30] shrink-0" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        More Information
                                    </h2>
                                    <p className="text-gray-600">
                                        Hopefully that has clarified things for you. However, if you are still looking for more information, you can contact us through one of our preferred contact methods:
                                    </p>
                                    <ul className="list-disc pl-5 mt-4 text-gray-600 space-y-2">
                                        <li>Email: <a href="mailto:privacy@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">privacy@cribnosh.co.uk</a></li>
                                        <li>Privacy Policy: <Link href="/privacy" className="text-[#ff3b30] hover:underline">View our detailed Privacy Policy</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </motion.section>

                    </div>
                </div>
            </ParallaxGroup>
        </main>
    );
}
