"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { AlertCircle, FileText, Globe, Scale, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";

export default function ModernSlaveryStatement() {
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
                        <p className="text-xl text-gray-600">
                            Fiscal Year {new Date().getFullYear()}
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
                                <Scale className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Our Commitment
                                    </h2>
                                    <p className="text-gray-600">
                                        CribNosh is committed to preventing acts of modern slavery and human trafficking from occurring within our business and supply chain. We maintain a zero-tolerance approach to modern slavery and act ethically and with integrity in all our business dealings and relationships. We are committed to implementing and enforcing effective systems and controls to ensure modern slavery is not taking place anywhere in our own business or in any of our supply chains.
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
                                        Structure and Supply Chain
                                    </h2>
                                    <p className="text-gray-600">
                                        CribNosh is a platform connecting local cooks with customers who want home-cooked meals. Our supply chain includes:
                                    </p>
                                    <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600">
                                        <li>Independent cooks and chefs who offer their services through our platform.</li>
                                        <li>Technology and infrastructure providers.</li>
                                        <li>Marketing and professional services partners.</li>
                                    </ul>
                                    <p className="text-gray-600 mt-3">
                                        We carefully vet our partners and maintain close relationships to ensure they align with our values and ethical standards.
                                    </p>
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
                                        Policies on Modern Slavery
                                    </h2>
                                    <p className="text-gray-600">
                                        We are committed to ensuring that there is no modern slavery or human trafficking in our supply chains or in any part of our business. Our policies reflect our commitment to acting ethically and with integrity in all our business relationships.
                                    </p>
                                    <p className="text-gray-600 mt-3">
                                        These include:
                                    </p>
                                    <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600">
                                        <li><strong>Whistleblowing Policy:</strong> We encourage all employees, customers, and other business partners to report any concerns related to the direct activities, or the supply chains of, our organization.</li>
                                        <li><strong>Supplier Code of Conduct:</strong> We are committed to ensuring that our suppliers adhere to the highest standards of ethics.</li>
                                        <li><strong>Recruitment Policy:</strong> We use only specified, reputable employment agencies to source labor and always verify the practices of any new agency we are using.</li>
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
                                <ShieldCheck className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Due Diligence Processes
                                    </h2>
                                    <p className="text-gray-600">
                                        As part of our initiative to identify and mitigate risk, we implement the following:
                                    </p>
                                    <ul className="list-disc pl-5 mt-3 space-y-2 text-gray-600">
                                        <li>Identify and assess potential risk areas in our supply chains.</li>
                                        <li>Mitigate the risk of slavery and human trafficking occurring in our supply chains.</li>
                                        <li>Monitor potential risk areas in our supply chains.</li>
                                        <li>Protect whistleblowers.</li>
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
                                <Globe className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Risk Assessment & Management
                                    </h2>
                                    <p className="text-gray-600">
                                        The board of directors helps to ensure that risk is managed effectively. We consider that the greatest risk of slavery and human trafficking resides in our supply chain, and we have procedures in place to manage this risk. We carry out due diligence on all suppliers and will not work with any organization that does not meet our standards.
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
                                <AlertCircle className="w-8 h-8 text-[#ff3b30]" />
                                <div>
                                    <h2 className="text-2xl font-asgard font-bold text-gray-900 mb-4">
                                        Training
                                    </h2>
                                    <p className="text-gray-600">
                                        To ensure a high level of understanding of the risks of modern slavery and human trafficking in our supply chains and our business, we provide training to our staff. We also expect our business partners to provide training to their staff.
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        <div className="text-center pt-8 border-t border-gray-200">
                            <p className="text-gray-500 italic">
                                This statement has been approved by the organization's board of directors and will be reviewed and updated annually.
                            </p>
                        </div>

                    </div>
                </div>
            </ParallaxGroup>
        </main>
    );
}
