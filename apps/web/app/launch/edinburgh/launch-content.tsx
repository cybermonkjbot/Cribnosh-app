"use client";

import { SwappingSubtitle } from "@/components/ui/swapping-subtitle";
import { ArrowRight, Brain, ChefHat, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";

/**
 * Edinburgh Launch Content
 * Full-screen hero layout with bottom-aligned image placeholder.
 * Features grid is pushed below the fold.
 */
export default function EdinburghLaunchContent() {
    // Parallax scroll effects
    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const features = [
        {
            title: "AI & You",
            description: "Your personal dietary profile that learns what you love and filters what you don't.",
            icon: <Brain className="w-6 h-6" />,
        },
        {
            title: "Chef Discovery",
            description: "Direct access to talented local creators. Follow, chat, and order from the best.",
            icon: <ChefHat className="w-6 h-6" />,
        },
        {
            title: "Mood Matching",
            description: "Feeling adventurous or need comfort? Our Emotion Engine matches meals to your mood.",
            icon: <Sparkles className="w-6 h-6" />,
        }
    ];

    return (
        <main className="relative min-h-screen w-full bg-white text-neutral-900 overflow-hidden selection:bg-[#ff3b30] selection:text-white">
            {/* Dynamic Background from Features Page */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(45%_45%_at_50%_50%,#ff3b3015_0%,transparent_100%)]" />
                <motion.div
                    style={{ y: y1 }}
                    className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#ff3b30]/5 to-transparent rounded-full blur-[120px] opacity-60"
                />
                <motion.div
                    style={{ y: y2 }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/5 to-transparent rounded-full blur-[100px] opacity-40"
                />
            </div>

            <div className="relative z-10">

                {/* Full-Screen Hero Section */}
                <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
                    <motion.div
                        style={{ opacity: heroOpacity, scale: heroScale }}
                        className="container mx-auto px-4 text-center z-20 pb-32" // Added padding-bottom to clear image area
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="font-asgard text-5xl md:text-7xl lg:text-8xl font-bold mb-8 text-neutral-900 leading-tight"
                        >
                            CribNosh is coming<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] to-[#ff8f84]">to Edinburgh this June.</span>
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="h-12 flex justify-center items-center"
                        >
                            <SwappingSubtitle
                                phrases={[
                                    "Your personal food creator, decoded by AI.",
                                    "Authentic meals, delivered to your door.",
                                    "Local creators, global flavors.",
                                    "Dining, evolved."
                                ]}
                                interval={3000}
                                className="text-center"
                                textClassName="text-xl md:text-3xl text-neutral-500 font-satoshi font-light"
                            />
                        </motion.div>
                    </motion.div>

                    {/* Bottom-Aligned Image Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="absolute bottom-0 left-0 right-0 h-[40vh] md:h-[50vh] z-10 pointer-events-none"
                    >
                        <div className="w-full h-full relative">
                            <Image
                                src="/edingburghbackground.png"
                                alt="Edinburgh Skyline"
                                fill
                                className="object-cover object-bottom"
                                priority
                            />
                        </div>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                    >
                        <div className="w-[1px] h-16 bg-gradient-to-b from-neutral-300 to-transparent" />
                    </motion.div>
                </section>

                {/* Features & Content Section (Below the fold) */}
                <section className="relative py-24 bg-white/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4">

                        {/* Features Grid */}
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-24 max-w-7xl mx-auto">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    className="group relative overflow-hidden rounded-3xl bg-white p-8 hover:bg-neutral-50 transition-all duration-300 border border-neutral-100/50 shadow-sm hover:shadow-md"
                                >
                                    <div className="relative z-10">
                                        <div className="mb-4 inline-block rounded-xl bg-[#ff3b30]/10 p-3 text-[#ff3b30]">
                                            {feature.icon}
                                        </div>
                                        <h3 className="mb-2 font-asgard text-xl sm:text-2xl font-bold text-[#ff3b30]">{feature.title}</h3>
                                        <p className="text-neutral-600 font-satoshi">{feature.description}</p>
                                    </div>
                                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#ff3b30]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </motion.div>
                            ))}
                        </div>

                        {/* Final CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-center max-w-4xl mx-auto pb-16"
                        >
                            <h2 className="font-asgard text-3xl md:text-5xl font-bold mb-8 text-neutral-900">
                                Be the first to taste the future.
                            </h2>
                            <Link
                                href="/waitlist"
                                className="inline-flex items-center justify-center rounded-full bg-[#ff3b30] px-8 py-3 text-lg font-bold text-white hover:bg-[#ff5e54] transition-colors duration-300 shadow-lg hover:shadow-[#ff3b30]/25"
                            >
                                <span>Join Priority Waitlist</span>
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <p className="mt-6 text-neutral-400 font-satoshi">
                                Limited spots available for June 2026 launch.
                            </p>
                        </motion.div>

                    </div>
                </section>

            </div>
        </main>
    );
}
