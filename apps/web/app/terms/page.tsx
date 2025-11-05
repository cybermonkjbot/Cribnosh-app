"use client";

import { motion } from "motion/react";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { Shield, Users, FileText, CreditCard, AlertTriangle, RefreshCw, Mail } from "lucide-react";

export default function TermsOfService() {
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
              Terms of Service
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
                <Shield className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Agreement to Terms
                  </h2>
                  <p className="text-gray-600">
                    By accessing or using CribNosh's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
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
                <Users className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Use of Services
                  </h2>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You must be at least 18 years old to use our services
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You are responsible for maintaining the security of your account
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You agree not to misuse or attempt to disrupt our services
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You must provide accurate and complete information
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
                <FileText className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    User Content
                  </h2>
                  <p className="text-gray-600 mb-4">
                    When you create, upload, or share content through our platform:
                  </p>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You retain ownership of your content
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You grant us a license to use and display your content
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You are responsible for the content you share
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      We may remove content that violates our policies
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
                <CreditCard className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Payment Terms
                  </h2>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      All payments are processed securely through our payment partners
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Prices are subject to change with notice
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      Refunds are handled according to our refund policy
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
                      You agree to pay all charges associated with your orders
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
                <AlertTriangle className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Limitation of Liability
                  </h2>
                  <p className="text-gray-600">
                    CribNosh and its suppliers shall not be liable for any damages arising from the use or inability to use our services. This includes but is not limited to direct, indirect, incidental, punitive, and consequential damages.
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
                <RefreshCw className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Changes to Terms
                  </h2>
                  <p className="text-gray-600">
                    We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of our services following any changes indicates your acceptance of the new terms.
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
                    Contact Information
                  </h2>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <p className="text-gray-600">
                    Email: legal@cribnosh.com<br />
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