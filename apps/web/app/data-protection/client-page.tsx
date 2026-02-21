"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import {
    Database,
    Eye,
    FileCheck,
    FileX,
    Lock,
    Mail,
    ShieldCheck,
    UserCheck
} from "lucide-react";
import { motion } from "motion/react";

export default function DataProtection() {
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
                            Data Protection
                        </h1>
                        <p className="text-xl text-gray-600">
                            Your Rights Under GDPR
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </motion.div>

                    <div className="space-y-12">

                        {/* Intro */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <ShieldCheck className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Commitment to Data Privacy
                                    </h2>
                                    <p className="text-gray-600">
                                        CribNosh is dedicated to protecting your personal data and respecting your privacy rights. This page outlines your rights under the General Data Protection Regulation (GDPR) and how you can exercise them.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Your Rights Grid */}
                        <div className="grid md:grid-cols-2 gap-6">

                            {/* Right to Access */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                            >
                                <Eye className="w-8 h-8 text-[#ff3b30] mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Right of Access</h3>
                                <p className="text-gray-600 text-sm">
                                    You have the right to request a copy of the personal data we hold about you. We will provide this information within one month of your request, free of charge.
                                </p>
                            </motion.div>

                            {/* Right to Rectification */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                            >
                                <FileCheck className="w-8 h-8 text-[#ff3b30] mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Right to Rectification</h3>
                                <p className="text-gray-600 text-sm">
                                    If you believe that any information we hold about you is incorrect or incomplete, you have the right to request that we correct it.
                                </p>
                            </motion.div>

                            {/* Right to Erasure */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                            >
                                <FileX className="w-8 h-8 text-[#ff3b30] mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Right to Erasure</h3>
                                <p className="text-gray-600 text-sm">
                                    Also known as the "right to be forgotten," you can request that we delete your personal data when it is no longer necessary for the purposes for which it was collected.
                                </p>
                            </motion.div>

                            {/* Right to Restriction */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                            >
                                <Lock className="w-8 h-8 text-[#ff3b30] mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Right to Restriction</h3>
                                <p className="text-gray-600 text-sm">
                                    You have the right to request that we restrict the processing of your personal data under certain circumstances, for example, if you contest the accuracy of the data.
                                </p>
                            </motion.div>

                            {/* Right to Data Portability */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                            >
                                <Database className="w-8 h-8 text-[#ff3b30] mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Right to Portability</h3>
                                <p className="text-gray-600 text-sm">
                                    You have the right to receive the personal data regarding you, which you have provided to us, in a structured, commonly used and machine-readable format.
                                </p>
                            </motion.div>

                            {/* Right to Object */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45 }}
                                className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                            >
                                <UserCheck className="w-8 h-8 text-[#ff3b30] mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Right to Object</h3>
                                <p className="text-gray-600 text-sm">
                                    You have the right to object to the processing of your personal data for direct marketing purposes or where the processing is based on our legitimate interests.
                                </p>
                            </motion.div>
                        </div>


                        {/* How to Exercise */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Mail className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        How to Exercise Your Rights
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        To exercise any of these rights, please contact our Data Protection Officer. We will respond to your request within one month.
                                    </p>
                                    <p className="text-gray-600">
                                        <strong>Email:</strong> <a href="mailto:privacy@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">privacy@cribnosh.co.uk</a><br />
                                        <strong>By Post:</strong> Data Protection Officer, CribNosh Limited, 50 Southhouse Broadway, Edinburgh, EH17 8AR.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* Complaints */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <FileCheck className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Complaints
                                    </h2>
                                    <p className="text-gray-600">
                                        If you are not satisfied with how we handle your request or believe we are processing your data unlawfully, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO).
                                    </p>
                                    <p className="mt-2">
                                        <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer" className="text-[#ff3b30] hover:underline">Visit the ICO website</a> for more information.
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
