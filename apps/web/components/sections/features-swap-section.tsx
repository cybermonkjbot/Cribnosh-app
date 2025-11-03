"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SwappingSubtitle } from "@/components/ui/swapping-subtitle";

const features = [
  {
    id: "dietary",
    title: "Dietary Memory",
    description: "Your personalized profile that remembers your preferences and restrictions.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
  {
    id: "allergen",
    title: "Allergen Safeguard",
    description: "Proactive allergen detection and alerts to keep you safe while dining.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    id: "ordering",
    title: "Smart Ordering",
    description: "Thoughtful order recommendations based on your taste profile and past experiences.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/5 p-4 sm:p-6 md:p-8 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10"
    >
      <div className="relative z-10">
        <div className="mb-3 sm:mb-4 inline-block rounded-xl bg-[#ff3b30]/10 p-2.5 sm:p-3 text-[#ff3b30]">
          {feature.icon}
        </div>
        <h3 className="mb-2 font-asgard text-lg sm:text-xl md:text-2xl font-bold text-[#ff3b30]">{feature.title}</h3>
        <p className="text-neutral-600 text-sm sm:text-base">{feature.description}</p>
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#ff3b30]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export function FeaturesSwapSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#ff3b3015_0%,transparent_100%)]" />
      
      <div className="container mx-auto px-2 sm:px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-asgard text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800 mb-4 sm:mb-6">
            CribNosh Intelligence,{" "}
            <span className="text-[#ff3b30]">
              Made for people
            </span>
          </h2>
          
          <div className="flex justify-center mb-6 sm:mb-8 px-1 sm:px-4">
            <div className="w-full max-w-4xl">
              <SwappingSubtitle
                phrases={[
                  "Your taste buds have a memory. We're just helping them remember.",
                  "Because your cravings are as unique as your fingerprint.",
                  "Where every meal feels like it was made just for you.",
                  "Your dietary preferences, our mission.",
                  "Smart enough to learn, personal enough to care.",
                  "Because food should understand you, not the other way around.",
                  "Your culinary companion that never forgets.",
                  "Where technology meets taste, and magic happens."
                ]}
                interval={4000}
                className="text-center w-full"
                textClassName="text-sm sm:text-base md:text-lg lg:text-xl text-neutral-800 leading-relaxed font-medium"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-16">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* CribNosh Intelligence Highlights - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative mt-16 sm:mt-24 mb-16 sm:mb-20"
        >
          {/* Enhanced Header - Mobile Optimized */}
          <div className="text-center mb-12 sm:mb-16 max-w-4xl mx-auto">
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 80 }}
              viewport={{ once: true }}
              className="font-asgard text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-800 mb-4 leading-tight"
            >
             Personalized Dining,{" "}
             <span className="text-[#ff3b30]">
                For Foodies, by Foodies
             </span>
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-neutral-600 text-lg sm:text-xl md:text-2xl font-medium leading-relaxed"
            >
              Technology that adapts to you
            </motion.p>
          </div>

          {/* Enhanced Highlights Grid - Mobile First */}
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-12 sm:mb-16">
            {[
              {
                title: "Learns your taste, not your data",
                description: "Built around your preferences, never for resale.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                delay: 0.7,
                color: "from-emerald-500/10 to-green-500/5"
              },
              {
                title: "Culturally fluent",
                description: "Respects your heritage, restrictions, and rituals.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3s-4.5 4.03-4.5 9 2.015 9 4.5 9z" />
                  </svg>
                ),
                delay: 0.8,
                color: "from-blue-500/10 to-indigo-500/5"
              },
              {
                title: "Human in the loop",
                description: "Real chefs tag, curate, and co-author recommendations.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
                delay: 0.9,
                color: "from-purple-500/10 to-pink-500/5"
              },
              {
                title: "You're in charge",
                description: "Adjust, pause, or reset your profile anytime.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h3.75" />
                  </svg>
                ),
                delay: 1.0,
                color: "from-orange-500/10 to-red-500/5"
              }
            ].map((highlight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: highlight.delay,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3, type: "spring", stiffness: 300 } 
                }}
                className="group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/15 hover:bg-white/25 transition-all duration-500 backdrop-blur-md border border-white/20 hover:border-white/30 shadow-lg hover:shadow-xl p-4 sm:p-6 md:p-8"
              >
                {/* Enhanced Hover Effects */}
                <div className={`absolute inset-0 bg-gradient-to-br ${highlight.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute inset-0 bg-gradient-to-br from-[#ff3b30]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                
                <div className="relative z-10">
                  <motion.div 
                    className="mb-3 sm:mb-4 md:mb-6 inline-block rounded-xl sm:rounded-2xl bg-[#ff3b30]/15 group-hover:bg-[#ff3b30]/25 p-2.5 sm:p-3 md:p-4 text-[#ff3b30] transition-all duration-300"
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 5,
                      transition: { duration: 0.2 }
                    }}
                  >
                    {highlight.icon}
                  </motion.div>
                  <h4 className="font-asgard text-base sm:text-lg md:text-xl font-bold text-neutral-800 mb-2 sm:mb-3 group-hover:text-[#ff3b30] transition-colors duration-300 leading-tight">
                    {highlight.title}
                  </h4>
                  <p className="text-neutral-600 text-xs sm:text-sm md:text-base leading-relaxed group-hover:text-neutral-700 transition-colors duration-300">
                    {highlight.description}
                  </p>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#ff3b30]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>

          {/* Enhanced CTA - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, type: "spring", stiffness: 100 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link
              href="/features"
              className="group relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff3b30] via-[#ff2d30] to-[#ff5e54] px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-bold text-white shadow-lg sm:shadow-2xl hover:shadow-[#ff3b30]/25 transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <span className="relative z-10 flex items-center">
                See all features
                <motion.svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5} 
                  stroke="currentColor" 
                  className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </motion.svg>
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
} 
