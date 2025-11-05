"use client";

import { motion } from "motion/react";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { Lock, Database, Cog, UserCheck, Scale, Bell, Mail } from "lucide-react";

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </motion.div>

          <div className="space-y-16">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Our Commitment to Your Privacy
                  </h2>
                  <p className="text-gray-600">
                    At CribNosh, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information when you use our platform. We believe in transparency and giving you control over your data.
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Database className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Information We Collect
                  </h2>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Account information (name, email, phone number)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Dietary preferences and restrictions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Order history and preferences
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Payment information (processed securely through our payment partners)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Device and usage information
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Cog className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    How We Use Your Information
                  </h2>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      To provide and improve our services
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      To personalize your dining experience
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      To process your orders and payments
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      To communicate with you about our services
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      To ensure platform safety and security
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <UserCheck className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Your Rights
                  </h2>
                  <p className="text-gray-600 mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Access your personal data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Correct inaccurate data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Request deletion of your data
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Object to data processing
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Export your data
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Scale className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Data Protection
                  </h2>
                  <p className="text-gray-600">
                    We implement robust security measures to protect your personal information from unauthorized access, alteration, or disclosure. This includes encryption, secure data storage, and regular security audits. We only retain your data for as long as necessary to provide our services and comply with legal obligations.
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Bell className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Updates to This Policy
                  </h2>
                  <p className="text-gray-600">
                    We may update this privacy policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any material changes and obtain your consent where required by law. Continued use of our services after such changes constitutes acceptance of the updated policy.
                  </p>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Mail className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Contact Us
                  </h2>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about this Privacy Policy, please contact us at:
                  </p>
                  <p className="text-gray-600">
                    Email: privacy@cribnosh.com<br />
                    Address: [Your Business Address]
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