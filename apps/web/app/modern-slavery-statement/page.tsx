"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { BarChart3, Building, Globe } from "lucide-react";
import { motion } from "motion/react";

export default function ModernSlaveryStatement() {
    const currentYear = new Date().getFullYear();

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
                            Anti-Modern Slavery Statement
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            This statement is made pursuant to Section 54 of the Modern Slavery Act 2015 and sets out the steps that CribNosh has taken and is continuing to take to ensure that modern slavery or human trafficking is not taking place within our business or supply chain during the financial year ending {currentYear}.
                        </p>
                    </motion.div>

                    <div className="space-y-12">

                        {/* 1. Our Business & Structure */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Building className="w-8 h-8 text-[#ff3b30] shrink-0" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Our Business and Organizational Structure
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        CribNosh is a culinary technology platform that connects local, independent cooks with customers seeking authentic, home-cooked meals. Operating primarily in the United Kingdom, our mission is to empower local talent and provide communities with accessible, high-quality food options.
                                    </p>
                                    <p className="text-gray-600">
                                        We do not directly employ the vast majority of cooks on our platform; rather, we facilitate their business through our technology. However, we recognize our responsibility to ensure that our platform is not used to exploit individuals and that our own corporate operations remain ethical and transparent.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* 2. Our Supply Chains */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Globe className="w-8 h-8 text-[#ff3b30] shrink-0" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Our Supply Chains
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        Our community is built on trust, and our supply chain reflects the diverse ecosystem of partners who make CribNosh possible:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-3 text-gray-600">
                                        <li>
                                            <strong className="text-gray-900">Food Creators:</strong> Independent individuals and small businesses who prepare meals. They are the heart of our platform, and we maintain strict oversight of their operations.
                                        </li>
                                        <li>
                                            <strong className="text-gray-900">Delivery Partners:</strong> A network of drivers and riders who ensure meals are delivered safely and efficiently.
                                        </li>
                                        <li>
                                            <strong className="text-gray-900">Technology & Infrastructure:</strong> Providers of cloud services, software development, data security, and IT hardware.
                                        </li>
                                        <li>
                                            <strong className="text-gray-900">Corporate & Professional Services:</strong> Marketing agencies, legal counsel, recruitment agencies, and facilities management for our offices.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </motion.section>

                        {/* 3. Policies */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div>
                                <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                    Our Policies on Slavery and Human Trafficking
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    We are committed to ensuring that there is no modern slavery or human trafficking in our supply chains or in any part of our business. Our internal policies reflect our commitment to acting ethically and with integrity in all our business relationships.
                                </p>
                                <ul className="list-none space-y-4 text-gray-600">
                                    <li className="flex gap-3">
                                        <span className="w-2 h-2 rounded-full bg-[#ff3b30] mt-2 shrink-0" />
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Anti-Slavery Policy</strong>
                                            Sets out our stance on modern slavery and explains how employees can identify any instances of this and where they can go for help.
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-2 h-2 rounded-full bg-[#ff3b30] mt-2 shrink-0" />
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Recruitment Policy</strong>
                                            We operate a robust recruitment policy, including conducting eligibility to work in the UK checks for all employees to safeguard against human trafficking or being forced to work against their will.
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-2 h-2 rounded-full bg-[#ff3b30] mt-2 shrink-0" />
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Whistleblowing Policy</strong>
                                            We encourage all employees, customers, and other business partners to report any concerns related to the direct activities, or the supply chains of, our organization. This includes any circumstances that may give rise to an enhanced risk of slavery or human trafficking.
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="w-2 h-2 rounded-full bg-[#ff3b30] mt-2 shrink-0" />
                                        <div>
                                            <strong className="text-gray-900 block mb-1">Supplier Code of Conduct</strong>
                                            We are committed to ensuring that our suppliers adhere to the highest standards of ethics. Suppliers are required to demonstrate that they provide safe working conditions where necessary, treat workers with dignity and respect, and act ethically and within the law in their use of labor.
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </motion.section>

                        {/* 4. Due Diligence & Vetting */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div>
                                <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                    Due Diligence & Vetting Processes
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    We employ rigorous validation and onboarding processes embedded directly into our technology platform to ensure compliance and safety across our network:
                                </p>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Food Creators</h3>
                                        <p className="text-gray-600 mb-2">Before activation, all cooks must undergo a comprehensive verification process including:</p>
                                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                                            <li>Validation of identity and background checks.</li>
                                            <li>Verification of Health Permits and Public Liability Insurance.</li>
                                            <li>Confirmation of FSA Food Hygiene Rating (0-5 stars).</li>
                                            <li>Review of certifications and food safety training.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Drivers & Delivery Partners</h3>
                                        <p className="text-gray-600 mb-2">We ensure all delivery partners meet strict legal requirements:</p>
                                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                                            <li>Verification of valid Driver's License and Vehicle Registration.</li>
                                            <li>Confirmation of appropriate Vehicle Insurance.</li>
                                            <li>Right to work checks where applicable.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">Internal Staff</h3>
                                        <p className="text-gray-600 mb-2">Our internal recruitment process is designed to prevent exploitation:</p>
                                        <ul className="list-disc pl-5 text-gray-600 space-y-1">
                                            <li>Complete "Right to Work in the UK" checks for all employees.</li>
                                            <li>Verification of identity documents (Passport/ID).</li>
                                            <li>Direct employment contracts with transparent terms.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* 5. Risk Assessment */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div>
                                <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                    Risk Assessment
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    We recognize that the risk of modern slavery varies across different sectors and geographies. We have identified the following areas as carrying a potential risk:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                    <li>
                                        <strong>Temporary Labor:</strong> The use of agency workers can sometimes present risks of exploitation. We mitigate this by using only specified, reputable employment agencies.
                                    </li>
                                    <li>
                                        <strong>Food Supply Chain:</strong> While we do not source food ingredients directly for cooks, we provide guidance to our cooks on ethical sourcing and monitor for any signs of malpractice in the businesses operating on our platform.
                                    </li>
                                    <li>
                                        <strong>Cleaning & Facilities Services:</strong> We ensure that any third-party providers for our corporate offices pay the Living Wage and adhere to strict labor standards.
                                    </li>
                                </ul>
                            </div>
                        </motion.section>

                        {/* 6. Key Performance Indicators (KPIs) */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <BarChart3 className="w-8 h-8 text-[#ff3b30] shrink-0" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Measuring Effectiveness
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        We use the following key performance indicators (KPIs) to measure how effective we have been to ensure that slavery and human trafficking is not taking place in any part of our business or supply chains:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <strong className="block text-gray-900 mb-1">Audit Results</strong>
                                            <span className="text-gray-600 text-sm">Percentage of suppliers and partners audited with zero non-compliance issues found.</span>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <strong className="block text-gray-900 mb-1">Training Completion</strong>
                                            <span className="text-gray-600 text-sm">100% of staff required to complete Modern Slavery training annually.</span>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <strong className="block text-gray-900 mb-1">Whistleblowing Reports</strong>
                                            <span className="text-gray-600 text-sm">Number of reports received and time taken to investigate and resolve them.</span>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <strong className="block text-gray-900 mb-1">Supplier Vetting</strong>
                                            <span className="text-gray-600 text-sm">Percentage of new suppliers successfully vetted against our Code of Conduct before engagement.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* 7. Training */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-100 shadow-sm"
                        >
                            <div>
                                <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                    Training and Awareness
                                </h2>
                                <p className="text-gray-600">
                                    To ensure a high level of understanding of the risks of modern slavery and human trafficking in our supply chains and our business, we provide training to our staff. All directors and employees have been briefed on the subject. We also expect our business partners to provide training to their staff and suppliers and providers.
                                </p>
                            </div>
                        </motion.section>

                        <div className="text-center pt-8 border-t border-gray-200 mt-12">
                            <p className="text-gray-900 font-medium mb-2">
                                This statement has been approved by the organization's Board of Directors.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-1 mt-6">
                                <span className="font-asgard font-bold text-lg text-gray-900">Signed on behalf of CribNosh</span>
                                <div className="w-32 h-1 bg-gray-300 my-4" />
                                <span className="text-gray-600">Director</span>
                                <span className="text-gray-500 text-sm">Date: {new Date().toLocaleDateString()}</span>
                                <span className="text-gray-500 text-sm mt-1">Next Review: February {new Date().getFullYear() + 1}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </ParallaxGroup>
        </main>
    );
}
