"use client";

import { CitiesSection, CityHero } from "@/components/sections";
import { SwappingSubtitle } from "@/components/ui/swapping-subtitle";
import { Brain, ChefHat, Sparkles, Zap } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Edinburg Launch Content
 * Re-designed client-side component for the Edinburgh launch page.
 * Uses the light theme aesthetic from the Features page (white background, neutral text).
 */
export default function EdinburghLaunchContent() {
    // Parallax scroll effects
    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);

    // Countdown target date
    const launchDate = new Date("2026-04-01T00:00:00");

    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = launchDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const features = [
        {
            title: "AI & You",
            description: "Your personal dietary profile that learns what you love and filters what you don't.",
            icon: <Brain className="w-8 h-8" />,
            color: "from-purple-500/10 to-indigo-600/10", // Lighter gradients for light mode
            iconColor: "text-purple-600"
        },
        {
            title: "Chef Discovery",
            description: "Direct access to talented local creators. Follow, chat, and order from the best.",
            icon: <ChefHat className="w-8 h-8" />,
            color: "from-amber-500/10 to-orange-600/10",
            iconColor: "text-amber-600"
        },
        {
            title: "Mood Matching",
            description: "Feeling adventurous or need comfort? Our Emotion Engine matches meals to your mood.",
            icon: <Sparkles className="w-8 h-8" />,
            color: "from-pink-500/10 to-rose-600/10",
            iconColor: "text-pink-600"
        }
    ];

    const neighborhoods = [
        {
            name: "Old Town",
            description: "Launch Zone A",
            specialty: "Priority Access",
            // Lighter gradients for backgrounds
            gradient: "from-amber-100 to-red-50"
        },
        {
            name: "New Town",
            description: "Launch Zone B",
            specialty: "High Demand",
            gradient: "from-blue-100 to-indigo-50"
        },
        {
            name: "Stockbridge",
            description: "Launch Zone C",
            specialty: "Waitlist Open",
            gradient: "from-emerald-100 to-teal-50"
        },
        {
            name: "Leith",
            description: "Launch Zone D",
            specialty: "Coming Soon",
            gradient: "from-cyan-100 to-blue-50"
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
                <CityHero city="Edinburgh" />

                {/* Enhanced Countdown Section - Light Mode */}
                <section className="py-20 relative border-y border-neutral-100 bg-white/60 backdrop-blur-md">
                    <div className="container mx-auto px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="font-asgard text-2xl md:text-3xl text-neutral-400 mb-8 uppercase tracking-[0.2em]">
                                Launching In
                            </h2>
                            <div className="flex flex-wrap justify-center gap-6 md:gap-12">
                                {[
                                    { label: "Days", value: timeLeft.days },
                                    { label: "Hours", value: timeLeft.hours },
                                    { label: "Minutes", value: timeLeft.minutes },
                                    { label: "Seconds", value: timeLeft.seconds }
                                ].map((item, i) => (
                                    <div key={item.label} className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#ff3b30]/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="relative w-24 h-28 md:w-32 md:h-40 bg-white border border-neutral-200 rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:border-[#ff3b30]/30 transition-all duration-300">
                                            <span className="font-asgard text-4xl md:text-6xl font-bold text-neutral-900 tabular-nums">
                                                {String(item.value).padStart(2, '0')}
                                            </span>
                                            <span className="text-xs md:text-sm text-neutral-400 font-satoshi mt-2 uppercase tracking-wider">{item.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section with Swapping Subtitle - Light Mode */}
                <section className="py-32 relative">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-20">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                viewport={{ once: true }}
                                className="font-asgard text-4xl md:text-6xl font-bold mb-6 text-neutral-900"
                            >
                                The Future of Food, <span className="text-[#ff3b30]">Arriving Soon.</span>
                            </motion.h2>

                            <div className="h-12 flex justify-center items-center">
                                <SwappingSubtitle
                                    phrases={[
                                        "Your personal chef, decoded by AI.",
                                        "Authentic meals, delivered to your door.",
                                        "Local creators, global flavors.",
                                        "Dining, evolved."
                                    ]}
                                    interval={3000}
                                    className="text-center"
                                    textClassName="text-xl md:text-2xl text-neutral-500 font-satoshi font-light"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: index * 0.2 }}
                                    viewport={{ once: true }}
                                    className="group relative"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                    {/* Matches FeatureCard style: bg-white/5 but adapted for light mode visibility: bg-white/60 or just white with border */}
                                    <div className="relative h-full p-8 rounded-3xl bg-white border border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md transition-all duration-500 group-hover:-translate-y-2 overflow-hidden">
                                        <div className={`mb-6 p-4 rounded-2xl bg-neutral-50 w-fit ${feature.iconColor} group-hover:scale-110 transition-transform duration-500`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="font-asgard text-2xl font-bold mb-4 text-neutral-900">{feature.title}</h3>
                                        <p className="font-satoshi text-neutral-600 text-lg leading-relaxed">
                                            {feature.description}
                                        </p>

                                        {/* Hover Shine Effect - subtle for light mode */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-neutral-100/50 to-transparent skew-x-12" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Neighborhoods Grid - Light Mode */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#ff3b30]/5 pointer-events-none" />

                    <div className="container mx-auto px-4 relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="bg-white/40 rounded-[3rem] p-8 md:p-16 border border-neutral-200 backdrop-blur-md"
                        >
                            <div className="text-center mb-16">
                                <h2 className="font-asgard text-3xl md:text-5xl font-bold mb-6 text-neutral-900">Activations Zones</h2>
                                <p className="font-satoshi text-xl text-neutral-600 max-w-2xl mx-auto">
                                    We are rolling out availability across the city in phases. Check your zone below.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {neighborhoods.map((area, index) => (
                                    <motion.div
                                        key={area.name}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer"
                                    >
                                        {/* Light gradient backgrounds */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${area.gradient} opacity-80`} />
                                        <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors duration-500" />

                                        <div className="relative h-full p-6 flex flex-col justify-end">
                                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <h3 className="font-asgard text-2xl font-bold mb-2 text-neutral-900">{area.name}</h3>
                                                <p className="font-satoshi text-sm text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                                    {area.description}
                                                </p>
                                                <div className="mt-4 pt-4 border-t border-neutral-900/10 flex items-center text-xs font-bold uppercase tracking-wider text-[#ff3b30] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
                                                    <Zap className="w-4 h-4 mr-2 fill-current" />
                                                    {area.specialty}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Final CTA - Light Mode */}
                <section className="py-32 relative text-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#ff3b30]/10 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="max-w-4xl mx-auto"
                        >
                            <h2 className="font-asgard text-5xl md:text-7xl font-bold mb-8 leading-tight text-neutral-900">
                                Don't Just Eat.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] to-[#ff8f84]">Experience It.</span>
                            </h2>
                            <p className="font-satoshi text-xl text-neutral-600 mb-12 max-w-2xl mx-auto">
                                Limited spots available for our Phase 1 rollout in April 2026. Secure your place in line today.
                            </p>

                            <Link href="/waitlist">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="group relative inline-flex items-center justify-center px-10 py-5 bg-[#ff3b30] text-white rounded-full font-asgard font-bold text-lg overflow-hidden shadow-lg hover:shadow-xl hover:shadow-[#ff3b30]/20 transition-all duration-300"
                                >
                                    <span className="relative z-10">Join Priority Access</span>
                                    <div className="absolute inset-0 bg-[#ff5e54] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                                </motion.button>
                            </Link>
                        </motion.div>
                    </div>
                </section>

                <CitiesSection />
            </div>
        </main>
    );
}
