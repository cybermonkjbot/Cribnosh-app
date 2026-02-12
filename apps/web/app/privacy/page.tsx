"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import {
  Bell,
  Building2,
  Clock,
  Cog,
  Database,
  FileText,
  Globe,
  Lock,
  Mail,
  Scale,
  Shield,
  UserCheck,
  Users
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

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
            <p className="text-sm text-gray-500 mt-2">
              Effective Date: 12 February 2026
            </p>
          </motion.div>

          <div className="space-y-12">
            {/* Data Controller */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Building2 className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Data Controller
                  </h2>
                  <p className="text-gray-600 mb-4">
                    CribNosh Limited (Company Registration No. SC832773), registered in Scotland, is the data controller responsible for your personal information.
                  </p>
                  <div className="text-gray-600 space-y-1">
                    <p><strong>Registered Office:</strong> 50 Southhouse Broadway, Edinburgh, EH17 8AR, United Kingdom</p>
                    <p><strong>Email:</strong> <a href="mailto:privacy@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">privacy@cribnosh.co.uk</a></p>
                    <p><strong>Data Protection Contact:</strong> <a href="mailto:dpo@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">dpo@cribnosh.co.uk</a></p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Introduction */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Our Commitment to Your Privacy
                  </h2>
                  <p className="text-gray-600 mb-4">
                    At CribNosh, we take your privacy seriously. This Privacy Policy explains how we collect, use, store, and protect your personal information in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                  </p>
                  <p className="text-gray-600">
                    We believe in transparency and giving you control over your data. This policy applies to all users of our platform, including customers, food creators, and delivery partners.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Information We Collect */}
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

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">Account Information</h3>
                  <ul className="list-none space-y-2 text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Full name, email address, phone number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Delivery addresses and location data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Profile photo and preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Dietary preferences, allergies, and restrictions</span>
                    </li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">Transaction Information</h3>
                  <ul className="list-none space-y-2 text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Order history, items purchased, and order preferences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Payment card details (tokenized and processed by Stripe)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Billing and delivery information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Refund and cancellation requests</span>
                    </li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">Technical Information</h3>
                  <ul className="list-none space-y-2 text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Device information (type, operating system, browser)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>IP address and approximate location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Cookies and similar tracking technologies (see our <Link href="/cookie-policy" className="text-[#ff3b30] hover:underline">Cookie Policy</Link>)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Usage data (pages visited, features used, time spent)</span>
                    </li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">Communications</h3>
                  <ul className="list-none space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Customer support messages and feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Reviews and ratings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Marketing preferences and communication history</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Legal Basis */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Scale className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Legal Basis for Processing
                  </h2>
                  <p className="text-gray-600 mb-4">
                    We process your personal data under the following legal bases:
                  </p>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Contract Performance:</strong> Processing necessary to fulfill our service agreement with you (order processing, delivery, payment)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Legitimate Interests:</strong> Improving our services, fraud prevention, security, and analytics
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Consent:</strong> Marketing communications and non-essential cookies (you can withdraw consent at any time)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Legal Obligation:</strong> Compliance with tax, accounting, and regulatory requirements
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* How We Use Information */}
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
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To provide, maintain, and improve our platform and services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To process orders, payments, and deliveries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To personalize your experience and provide recommendations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To communicate with you about orders, updates, and customer support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To send marketing communications (with your consent)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To ensure platform safety, security, and prevent fraud</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To analyze usage patterns and improve our services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>To comply with legal obligations and enforce our terms</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Third-Party Sharing */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Sharing Your Information
                  </h2>
                  <p className="text-gray-600 mb-4">
                    We share your personal information only in the following circumstances:
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">Service Providers</h3>
                  <ul className="list-none space-y-2 text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Stripe:</strong> Payment processing and fraud prevention
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Convex:</strong> Database and backend services
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>AWS:</strong> Cloud hosting and infrastructure
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Analytics Providers:</strong> Usage analytics and performance monitoring
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Communication Services:</strong> Email and SMS delivery
                      </div>
                    </li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">Platform Participants</h3>
                  <ul className="list-none space-y-2 text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Food creators receive your name, delivery address, and order details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Delivery partners receive your name, delivery address, and contact information</span>
                    </li>
                  </ul>

                  <h3 className="text-lg font-bold text-gray-900 mb-3 mt-6">Legal Requirements</h3>
                  <p className="text-gray-600">
                    We may disclose your information to comply with legal obligations, court orders, or to protect our rights and safety.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* International Transfers */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Globe className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    International Data Transfers
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Some of our service providers are located outside the UK and EEA. When we transfer your data internationally, we ensure appropriate safeguards are in place:
                  </p>
                  <ul className="list-none space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Transfers to countries with adequacy decisions (e.g., EU-UK adequacy)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Standard Contractual Clauses approved by the UK ICO</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Binding Corporate Rules for multinational service providers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Data Retention */}
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
                    Data Retention
                  </h2>
                  <p className="text-gray-600 mb-4">
                    We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy:
                  </p>
                  <ul className="list-none space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Account Data:</strong> Retained while your account is active, plus 6 months after closure
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Transaction Records:</strong> 7 years for tax and accounting purposes
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Marketing Data:</strong> Until you withdraw consent or 2 years of inactivity
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Technical Logs:</strong> 90 days for security and troubleshooting
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Your Rights */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <UserCheck className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Your Data Protection Rights
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Under UK GDPR, you have the following rights:
                  </p>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Right of Access:</strong> Request a copy of your personal data
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Right to Rectification:</strong> Correct inaccurate or incomplete data
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Right to Restriction:</strong> Limit how we use your data
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Right to Data Portability:</strong> Receive your data in a structured, machine-readable format
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Right to Object:</strong> Object to processing based on legitimate interests or direct marketing
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong className="text-gray-900">Right to Withdraw Consent:</strong> Withdraw consent for processing at any time
                      </div>
                    </li>
                  </ul>
                  <p className="text-gray-600 mt-4">
                    To exercise these rights, please contact us at <a href="mailto:privacy@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">privacy@cribnosh.co.uk</a> or visit our <Link href="/data-protection" className="text-[#ff3b30] hover:underline">Data Protection page</Link>. We will respond within one month.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Automated Decision-Making */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Automated Decision-Making and Profiling
                  </h2>
                  <p className="text-gray-600 mb-4">
                    We use automated systems to:
                  </p>
                  <ul className="list-none space-y-2 text-gray-600 mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Recommend meals based on your preferences and order history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Detect and prevent fraudulent transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Optimize delivery routes and estimated delivery times</span>
                    </li>
                  </ul>
                  <p className="text-gray-600">
                    These automated processes do not produce legal effects or significantly affect you. You have the right to request human intervention and challenge automated decisions.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Children's Privacy */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Children's Privacy
                  </h2>
                  <p className="text-gray-600">
                    Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately at <a href="mailto:privacy@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">privacy@cribnosh.co.uk</a>.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Data Security */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Data Security
                  </h2>
                  <p className="text-gray-600 mb-4">
                    We implement robust technical and organizational security measures to protect your personal information:
                  </p>
                  <ul className="list-none space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Encryption of data in transit (TLS/SSL) and at rest</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Regular security audits and penetration testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Access controls and authentication mechanisms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Employee training on data protection and security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Incident response and data breach notification procedures</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Updates */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Bell className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Updates to This Policy
                  </h2>
                  <p className="text-gray-600">
                    We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or for other operational reasons. We will notify you of any material changes by email or through a prominent notice on our platform. The "Last Updated" date at the top of this policy indicates when it was last revised. Your continued use of our services after changes constitutes acceptance of the updated policy.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Supervisory Authority */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Scale className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Complaints and Supervisory Authority
                  </h2>
                  <p className="text-gray-600 mb-4">
                    If you have concerns about how we handle your personal data, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO):
                  </p>
                  <div className="text-gray-600 space-y-1">
                    <p><strong>ICO Website:</strong> <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-[#ff3b30] hover:underline">www.ico.org.uk</a></p>
                    <p><strong>Helpline:</strong> 0303 123 1113</p>
                    <p><strong>Address:</strong> Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Contact */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Mail className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    Contact Us
                  </h2>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about this Privacy Policy or wish to exercise your data protection rights, please contact us:
                  </p>
                  <div className="text-gray-600 space-y-1">
                    <p><strong>Email:</strong> <a href="mailto:privacy@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">privacy@cribnosh.co.uk</a></p>
                    <p><strong>Data Protection Officer:</strong> <a href="mailto:dpo@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">dpo@cribnosh.co.uk</a></p>
                    <p><strong>Address:</strong> CribNosh Limited, 50 Southhouse Broadway, Edinburgh, EH17 8AR, United Kingdom</p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </ParallaxGroup>
    </main>
  );
} 