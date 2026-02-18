"use client";

import { CitiesSection, CityHero } from "@/components/sections";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "motion/react";
import Link from "next/link";

/**
 * Renders an enhanced Edinburgh city page with themed sections highlighting local food culture, 
 * neighborhoods, and a call to action to join the waitlist.
 */
export default function EdinburghPage() {
    const features = [
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
            title: "Scottish Heritage",
            description: "Edinburgh's rich history is reflected in its diverse food scene, blending traditional Scottish flavors with global influences.",
            stats: "Global Culinary Hub"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
                </svg>
            ),
            title: "Local Delicacies",
            description: "From fresh seafood to the finest local produce, Edinburgh's Food Creators bring authentic taste to your door.",
            stats: "Premium Ingredients"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
            ),
            title: "Vibrant Communities",
            description: "We're launching in Edinburgh's most iconic neighborhoods, connecting you with local culinary talent.",
            stats: "Citywide Reach"
        }
    ];

    const neighborhoods = [
        {
            name: "Old Town",
            description: "Historic heart of the city with centuries of culinary tradition.",
            specialty: "Traditional Scottish",
            color: "from-amber-600 to-red-600"
        },
        {
            name: "New Town",
            description: "Elegant Georgian streets home to sophisticated modern dining.",
            specialty: "Contemporary Cuisine",
            color: "from-blue-600 to-indigo-600"
        },
        {
            name: "Stockbridge",
            description: "Village-feel neighborhood famous for its artisanal markets.",
            specialty: "Artisan Produce",
            color: "from-green-600 to-teal-600"
        },
        {
            name: "Leith",
            description: "Vibrant port area with a booming independent food scene.",
            specialty: "Seafood & Global",
            color: "from-purple-600 to-pink-600"
        }
    ];

    return (
        <main className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white">
            <CityHero city="Edinburgh" />

            {/* Enhanced City-specific feature section */}
            <section className="py-24 bg-gradient-to-b from-[#ff3b30]/10 to-transparent">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                            Edinburgh's Premier Food Platform
                        </h2>
                        <p className="text-lg text-white/90 max-w-2xl mx-auto">
                            As our first launch city, Edinburgh represents the perfect blend of heritage and innovation. CribNosh is excited to bring personalized home-cooked meals to the Scottish capital.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5 }}
                            >
                                <GlassCard className="h-full p-8 group cursor-pointer">
                                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                                    <p className="text-gray-700 mb-4">
                                        {feature.description}
                                    </p>
                                    <div className="text-sm font-semibold text-[#ff3b30]">
                                        {feature.stats}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Neighborhoods Section */}
            <section className="py-16 bg-white/5 backdrop-blur-sm">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                            Launching in Your Ward
                        </h2>
                        <p className="text-lg text-white/80 max-w-2xl mx-auto">
                            From the cobbled streets of the Old Town to the vibrant docks of Leith, discover where CribNosh will be connecting with Edinburgh's local Food Creators.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {neighborhoods.map((neighborhood, index) => (
                            <motion.div
                                key={neighborhood.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -5 }}
                            >
                                <GlassCard className="h-full p-6 group cursor-pointer">
                                    <div className={`w-full h-2 bg-gradient-to-r ${neighborhood.color} rounded-full mb-4`}></div>
                                    <h3 className="text-lg font-bold mb-2 text-gray-900">{neighborhood.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{neighborhood.description}</p>
                                    <div className="text-xs font-medium text-[#ff3b30]">{neighborhood.specialty}</div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* City-specific CTA */}
            <section className="py-16 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                        Be the First to Taste Home in Edinburgh
                    </h2>
                    <p className="text-lg mb-8 max-w-2xl mx-auto">
                        Join the Edinburgh waitlist today and be among the first to experience authentic, home-cooked meals delivered to your door.
                    </p>
                    <Link href="/waitlist">
                        <motion.button
                            className="inline-flex items-center px-8 py-4 bg-white text-[#ff3b30] rounded-xl font-medium hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Join Edinburgh Waitlist</span>
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </motion.button>
                    </Link>
                </div>
            </section>

            <CitiesSection />
        </main>
    );
}
