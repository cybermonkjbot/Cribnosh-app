"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import {
  AlertTriangle,
  Car,
  ChefHat,
  CreditCard,
  FileText,
  Gavel,
  Globe,
  Lock,
  RefreshCw,
  Shield,
  Users
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

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
            <p className="text-sm text-gray-500 mt-2">
              Effective Date: 12 February 2026
            </p>
          </motion.div>

          <div className="space-y-12">

            {/* Introduction and Agreement */}
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
                    1. Agreement to Terms
                  </h2>
                  <p className="text-gray-600 mb-4">
                    These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and CribNosh Limited ("CribNosh", "we", "us", or "our"), a company registered in Scotland (Company No. SC834534).
                  </p>
                  <p className="text-gray-600">
                    By accessing or using our website, mobile application, or services (collectively, the "Platform"), you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not use our Platform.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Account & Eligibility */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    2. Account Registration & Eligibility
                  </h2>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Eligibility:</strong> You must be at least 18 years old to create an account and use our services. By using the Platform, you represent and warrant that you meet this age requirement.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Accuracy of Information:</strong> You agree to provide accurate, current, and complete information during registration and to keep this information updated.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Platform Services & Rules */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Globe className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    3. Platform Services & User Conduct
                  </h2>
                  <p className="text-gray-600 mb-4">
                    CribNosh provides a marketplace platform connecting independent food creators with customers. We facilitate orders and payments but constitute a technology service provider, not a food preparation entity or employer.
                  </p>
                  <p className="text-gray-600 mb-4"><strong>Prohibited Conduct:</strong> You agree not to:</p>
                  <ul className="list-none space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Use the Platform for any illegal or unauthorized purpose</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Harass, abuse, or harm another person</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Interfere with or disrupt the security or performance of the Platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <span>Attempt to reverse engineer or scrape data from the Platform</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Terms for Food Creators */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <ChefHat className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    4. Terms for Food Creators
                  </h2>
                  <p className="text-gray-600 mb-4">
                    If you register as a Food Creator, the following additional terms apply:
                  </p>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Compliance:</strong> You must comply with all applicable food safety laws, regulations, and hygiene standards. You must maintain a valid registration with your local authority and a valid Food Hygiene Rating.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Insurance:</strong> You are required to maintain appropriate public liability insurance.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Independence:</strong> You acknowledge that you are an independent contractor/business and not an employee of CribNosh. You are responsible for your own taxes and national insurance contributions.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Terms for Drivers */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Car className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    5. Terms for Delivery Partners
                  </h2>
                  <p className="text-gray-600 mb-4">
                    If you register as a Delivery Partner ("Driver"), the following additional terms apply:
                  </p>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Requirements:</strong> You must hold a valid driver's license, appropriate vehicle insurance (including hire and reward if applicable), and have the legal right to work in the UK.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Conduct:</strong> You agree to deliver orders safely, efficiently, and professionally, complying with all traffic laws.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Status:</strong> You acknowledge your status as an independent contractor, responsible for your own vehicle maintenance, fuel, and tax obligations.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Payment & Refunds */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <CreditCard className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    6. Payment & Refunds
                  </h2>
                  <ul className="list-none space-y-3 text-gray-600">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Pricing:</strong> All prices are displayed inclusive of applicable VAT unless stated otherwise. Delivery fees and service charges are calculated at checkout.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Payment Processing:</strong> Payments are processed securely via Stripe. By placing an order, you authorize us to charge your selected payment method.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30] mt-2" />
                      <div>
                        <strong>Refunds:</strong> Refunds are handled in accordance with our <Link href="/refund-policy" className="text-[#ff3b30] hover:underline">Refund Policy</Link>. Generally, refunds may be issued for missing items, quality issues, or non-delivery.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Intellectual Property */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    7. Intellectual Property & User Content
                  </h2>
                  <p className="text-gray-600 mb-4">
                    The Platform and its original content, features, and functionality are owned by CribNosh and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                  </p>
                  <p className="text-gray-600 mb-4">
                    <strong>User Content:</strong> By posting content (photos, reviews, menus) on the Platform, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with providing and promoting the Platform.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Liability & Disclaimers */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    8. Limitation of Liability
                  </h2>
                  <p className="text-gray-600 mb-4">
                    To the fullest extent permitted by law, CribNosh shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Our liability is limited to the greater of (a) the amount of fees you paid to us in the 12 months prior to the action giving rise to liability, or (b) £100.
                  </p>
                  <p className="text-gray-600 text-sm italic">
                    Nothing in these Terms excludes or limits our liability for death or personal injury arising from our negligence, or for fraud or fraudulent misrepresentation.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Termination */}
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
                    9. Termination
                  </h2>
                  <p className="text-gray-600">
                    We may terminate or suspend your account and bar access to the Platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Jurisdiction & Governing Law */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <Gavel className="w-8 h-8 text-[#ff3b30]" />
                <div>
                  <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                    10. Governing Law & Jurisdiction
                  </h2>
                  <p className="text-gray-600">
                    These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales. We retain the right to bring proceedings against you for breach of these conditions in your country of residence or any other relevant country.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Updates & Contact */}
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
                    11. Changes & Contact
                  </h2>
                  <p className="text-gray-600 mb-6">
                    We reserve the right to modify these Terms at any time. We will provide notice of significant changes. Your continued use of the Platform signifies your acceptance of the changes.
                  </p>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">Contact Us</h3>
                  <p className="text-gray-600">
                    If you have any questions about these Terms, please contact us at:<br />
                    <strong>Email:</strong> <a href="mailto:legal@cribnosh.co.uk" className="text-[#ff3b30] hover:underline">legal@cribnosh.co.uk</a><br />
                    <strong>Address:</strong> 50 Southhouse Broadway, Edinburgh, EH17 8AR, United Kingdom
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