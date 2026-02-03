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
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">From Passion to Purpose</h3>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-6 leading-relaxed">
                        I&apos;ve always believed that innovation isn&apos;t just about creating new things, it&apos;s about solving old problems in new, sustainable ways. My background in Chemical Engineering and Business (MBA) taught me to think analytically, but my heart has always been rooted in community, culture, and the simple act of sharing a good meal.
                    </p>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-8 leading-relaxed">
                        CribNosh was born out of a personal realization and a deep sense of responsibility. During my time in the UK, one thing stood out to me immediately: this country is an incredible mosaic of cultures, migrants, and cuisines from every corner of the globe. Yet, in this beautiful diversity, I noticed something missing: <span className="font-bold text-gray-900">Representation.</span>
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
                            alt="Observation of culture"
                            width={500}
                            height={500}
                            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "The Gap",
            content: (
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Why was it so hard to find?</h3>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-6 leading-relaxed">
                        While you could easily find popular international chains and mainstream cuisine, authentic foods from smaller nations, the Caribbean islands, micro-states in Africa, Central America, and Southeast Asia, were often invisible. The few that existed were either unaffordable or failed to capture the original taste, warmth, and identity of home.
                    </p>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-6 leading-relaxed italic border-l-4 border-[#ff3b30] pl-4">
                        &quot;Why should food that tells the story of someone&apos;s heritage be so hard to find?&quot;
                    </p>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-8 leading-relaxed">
                        That single question changed everything. When I began researching, I found the problem was much bigger than missing flavours, it was systemic. Starting or running a restaurant in the UK were too expensive, often costing upwards of £60,000–£120,000 annually just to stay afloat. Even passionate cooks couldn&apos;t take the risk.
                    </p>
                </div>
            ),
        },
        {
            title: "The Birth",
            content: (
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Building What Didn&apos;t Exist</h3>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-6 leading-relaxed">
                        CribNosh isn&apos;t just another food platform, it&apos;s a community movement. It&apos;s where trusted home kitchens meet the public. Where heritage recipes are rediscovered. Where local cooks become creators, and customers eat with confidence.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-[#ff3b30] mt-1">•</span>
                                <span className="text-gray-600 font-satoshi">Lower the cost barrier for talented cooks to earn from home.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#ff3b30] mt-1">•</span>
                                <span className="text-gray-600 font-satoshi">Build trust with verified hygiene ratings and food safety training.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#ff3b30] mt-1">•</span>
                                <span className="text-gray-600 font-satoshi">Use AI-powered personalization to match people with meals that fit their dietary, cultural, and emotional needs.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#ff3b30] mt-1">•</span>
                                <span className="text-gray-600 font-satoshi">Give every user—Creator or Customer—the ability to feel seen, valued, and safe.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="rounded-lg overflow-hidden shadow-xl">
                        <Image
                            src="/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg"
                            alt="Community building"
                            width={500}
                            height={500}
                            className="w-full h-auto object-cover"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Our Impact",
            content: (
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Sustainability is Our Pride</h3>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-6 leading-relaxed">
                        In just our two-month pre-launch phase, we&apos;ve already signed up over 500 food creators across the Midlands. Why? Because people believe in what we stand for: trust, inclusivity, and opportunity.
                    </p>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-6 leading-relaxed">
                        Through our Creator Inclusion Model, we ensure that anyone including migrants, students, or people with work restrictions can still share their culinary gifts safely and legally. We&apos;re not just feeding people; we&apos;re fueling independence, culture, and connection.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                        <h4 className="font-bold text-gray-900 mb-4 font-display">Our mission extends beyond the app:</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-[#ff3b30] mt-1">•</span>
                                <span className="text-gray-600 font-satoshi">Increase local food employment by 80%.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#ff3b30] mt-1">•</span>
                                <span className="text-gray-600 font-satoshi">Reduce food waste and hunger by up to 90% through community programs like <span className="italic">Eco Nosh</span> and <span className="italic">Nosh Games</span>.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#ff3b30] mt-1">•</span>
                                <span className="text-gray-600 font-satoshi">Help families save up to 60% compared to traditional takeaway costs.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            ),
        },
        {
            title: "Looking Ahead",
            content: (
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">The Promise</h3>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-4 leading-relaxed">
                        My dream for CribNosh is a world where anyone can eat what they love, wherever they are, safely, affordably, and proudly. Where your grandmother&apos;s stew, your father&apos;s spice mix, or your aunt&apos;s bread pudding can reach a global audience all from your kitchen table.
                    </p>
                    <p className="text-gray-600 font-satoshi text-base md:text-lg mb-8 leading-relaxed font-medium">
                        Because food isn&apos;t just fuel. It&apos;s identity. It&apos;s connection. It&apos;s home. <br />
                        And with CribNosh, <span className="text-gray-900 font-bold">home is never far away.</span>
                    </p>
                    <Image
                        src="/mobilemockstatic.png"
                        alt="CribNosh Vision"
                        width={500}
                        height={500}
                        className="rounded-lg object-cover w-full shadow-[0_0_24px_rgba(34,42,53,0.06),0_1px_1px_rgba(0,0,0,0.05),0_0_0_1px_rgba(34,42,53,0.04),0_0_4px_rgba(34,42,53,0.08),0_16px_68px_rgba(47,48,55,0.05),0_1px_0_rgba(255,255,255,0.1)_inset]"
                    />
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
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff3b30]/20 rounded-full blur-[80px] [backface-visibility:hidden] [transform:translateZ(0)]"
                />

                <ParallaxContent>
                    <div className="text-center max-w-4xl mx-auto relative z-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-[#ff3b30] text-sm font-medium mb-6 backdrop-blur-md [backface-visibility:hidden] [transform:translateZ(0)]">
                                The CribNosh Story
                            </span>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-8 tracking-tight">
                                From Passion <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] to-[#ff5e54]">
                                    To Purpose
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-satoshi leading-relaxed">
                                by Doyle Omachonu, Founder & CEO
                            </p>
                        </motion.div>
                    </div>
                </ParallaxContent>

                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 [will-change:transform]"
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

            {/* A Note From Me Section */}
            <section className="relative z-10 bg-gray-50 py-24 px-4 border-t border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <ParallaxContent>
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-6">
                                    A Note <span className="text-[#ff3b30]">From Me</span>
                                </h2>
                                <p className="text-gray-600 text-lg font-satoshi mb-6 leading-relaxed">
                                    I&apos;ve always believed that <span className="font-bold text-gray-900">purpose is stronger than profit.</span> CribNosh is my way of proving that <span className="font-bold text-gray-900">innovation can uplift communities</span> while making great food accessible for all.
                                </p>
                                <p className="text-gray-600 text-lg font-satoshi mb-6 leading-relaxed">
                                    I&apos;m an entrepreneur fueled by <span className="font-bold text-gray-900">passion, grit, and a relentless pursuit of excellence</span> but most importantly, I&apos;m someone who believes that <span className="font-bold text-gray-900">every meal has a story, and every story deserves to be told.</span>
                                </p>
                                <p className="text-xl font-display font-bold text-gray-900 mb-8">
                                    Welcome to CribNosh — where every bite brings us closer to home.
                                </p>
                                {/* <Link href="/staff" className="inline-flex items-center gap-2 text-[#ff3b30] font-bold hover:gap-3 transition-all group">
    Meet the whole team
    <span className="bg-[#ff3b30]/10 p-2 rounded-full group-hover:bg-[#ff3b30] group-hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
    </span>
</Link> */}
                            </div>
                            <div className="relative">
                                <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <Image
                                        src="/IMG_3491.jpg"
                                        alt="CribNosh Founder - Doyle Omachonu"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-8 left-8 text-white">
                                        <p className="font-display text-2xl font-bold">Doyle Omachonu</p>
                                        <p className="opacity-80">Founder & CEO</p>
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
                        Whether you&apos;re a creator looking to share your passion or a diner seeking a taste of home, there&apos;s a place for you at our table.
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
