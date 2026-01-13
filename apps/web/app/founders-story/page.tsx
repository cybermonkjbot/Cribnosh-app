"use client";

import { MasonryBackground } from "@/components/ui/masonry-background";
import { ParallaxContent } from "@/components/ui/parallax-section";
import { Timeline } from "@/components/ui/timeline";
import { motion, useScroll } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export default function FoundersStoryPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const timelineData = [
        {
            title: "The Spark",
            content: (
                <div>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-8 leading-relaxed">
                        It started with a simple craving. Not for just any food, but for the specific, comforting taste of home-cooked Jollof rice that no restaurant seemed to get quite right. We realized that while we could order almost anything, the authentic, soulful meals prepared in home kitchens were inaccessible.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <Image
                            src="/kitchenillus.png"
                            alt="Early kitchen sketches"
                            width={500}
                            height={500}
                            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]"
                        />
                        <Image
                            src="/card-images/IMG_2262.png"
                            alt="First community meal"
                            width={500}
                            height={500}
                            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Building the Bridge",
            content: (
                <div>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-8 leading-relaxed">
                        We spent months visiting local cooks, hearing their stories of heritage and passion. Many were amazing chefs but lacked a platform. We decided to build that bridge—connecting these hidden culinary gems with food lovers craving authenticity.
                    </p>
                    <div className="rounded-lg overflow-hidden shadow-xl">
                        <Image
                            src="/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg"
                            alt="Community building"
                            width={800}
                            height={500}
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "The Launch",
            content: (
                <div>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-4 leading-relaxed">
                        CribNosh was born not just as an app, but as a movement. A movement to democratize the food industry, empowering home cooks to become micro-entrepreneurs while giving diners access to the diverse, rich tapestry of global home cooking.
                    </p>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-8 leading-relaxed">
                        Today, we are more than a platform; we are a community celebrating culture, connection, and the universal language of food.
                    </p>
                    <Image
                        src="/cribnoshlivescreen.png"
                        alt="CribNosh Launch"
                        width={800}
                        height={500}
                        className="rounded-lg object-cover w-full shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]"
                    />
                </div>
            ),
        },
        {
            title: "The Vision",
            content: (
                <div>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-4 leading-relaxed">
                        We envision a world where anyone, anywhere, can access a fresh, home-cooked meal. Where the "kitchen next door" is your favorite restaurant, and where culinary traditions are preserved and shared widely.
                    </p>
                </div>
            ),
        },
    ];

    return (
        <div ref={containerRef} className="min-h-screen bg-black">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <MasonryBackground />
            </div>

            {/* Hero Section */}
            <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden pt-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff3b30]/20 rounded-full blur-[120px]"
                />

                <ParallaxContent>
                    <div className="text-center max-w-4xl mx-auto relative z-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-[#ff3b30] text-sm font-medium mb-6 backdrop-blur-md">
                                Our Origin Story
                            </span>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 tracking-tight">
                                From Our Kitchen <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] to-[#ff5e54]">
                                    To Yours
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-satoshi leading-relaxed">
                                CribNosh wasn't built in a boardroom. It was built in a kitchen, fueled by a hunger for authentic connection and real food.
                            </p>
                        </motion.div>
                    </div>
                </ParallaxContent>

                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                </motion.div>
            </section>

            {/* Timeline Section */}
            <section className="relative z-10 bg-white rounded-t-[3rem] md:rounded-t-[5rem] overflow-hidden -mt-20 pt-20 pb-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-6">The Journey</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg font-satoshi">
                            How a simple idea transformed into a movement for home cooks and food lovers everywhere.
                        </p>
                    </div>
                    <Timeline data={timelineData} />
                </div>
            </section>

            {/* Founders / Team Section */}
            <section className="relative z-10 bg-gray-50 py-24 px-4 border-t border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <ParallaxContent>
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-6">
                                    Built by <span className="text-[#ff3b30]">Passionate</span> Foodies
                                </h2>
                                <p className="text-gray-600 text-lg font-satoshi mb-8 leading-relaxed">
                                    We are a team of dreamers, doers, and—most importantly—eaters. Our diverse backgrounds in technology and culinary arts meet at one intersection: the belief that food is the most powerful community builder.
                                </p>
                                <p className="text-gray-600 text-lg font-satoshi mb-8 leading-relaxed">
                                    Every line of code, every design decision, and every partnership is crafted with the same care you'd put into a family meal.
                                </p>
                                <Link href="/staff" className="inline-flex items-center gap-2 text-[#ff3b30] font-bold hover:gap-3 transition-all group">
                                    Meet the whole team
                                    <span className="bg-[#ff3b30]/10 p-2 rounded-full group-hover:bg-[#ff3b30] group-hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </span>
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <Image
                                        src="/backgrounds/masonry-1.jpg" // Placeholder for team/founder image
                                        alt="CribNosh Team"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-8 left-8 text-white">
                                        <p className="font-display text-2xl font-bold">The CribNosh Team</p>
                                        <p className="opacity-80">Building the future of food</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ParallaxContent>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 bg-black text-white py-32 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[#ff3b30] opacity-10 blur-[100px]" />
                <div className="max-w-4xl mx-auto text-center relative z-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-display font-bold mb-8"
                    >
                        Be Part of Our Story
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 mb-12 font-satoshi max-w-2xl mx-auto"
                    >
                        Whether you're a creator looking to share your passion or a diner seeking a taste of home, there's a place for you at our table.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/waitlist" className="px-8 py-4 bg-[#ff3b30] text-white rounded-xl font-bold text-lg hover:bg-[#ff5e54] transition-colors shadow-[0_0_20px_rgba(255,59,48,0.4)] hover:shadow-[0_0_30px_rgba(255,59,48,0.6)]">
                            Join the Movement
                        </Link>
                        <Link href="/cooking" className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors">
                            Start Cooking
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
