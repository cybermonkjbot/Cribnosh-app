"use client";

import Link from "next/link";
import { MasonryBackground } from "@/components/ui/masonry-background";
import { ParallaxContent } from "@/components/ui/parallax-section";
import { motion } from "motion/react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MasonryBackground className="z-0" />
      
      {/* Content with relative positioning and higher z-index */}
      <div className="relative z-10">
        {/* Hero Section - Increased top padding */}
        <section className="pt-24 sm:pt-40 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8" data-section-theme="light">
          <div className="max-w-7xl mx-auto">
            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                  The Home of Food Creators{" "}
                  <span className="text-[#ff3b30]">and Foodies</span>
                </h1>
                <p className="font-satoshi text-lg sm:text-xl text-gray-600 max-w-3xl">
                  CribNosh is revolutionizing the way people experience home-cooked meals,
                  creating opportunities for talented chefs and bringing communities
                  together through the love of food. Where food meets its lovers.
                </p>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>

        {/* Mission & Values - Added top margin */}
        <section className="py-12 sm:py-20 mt-4 sm:mt-8 px-4 sm:px-6 lg:px-8" data-section-theme="light">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-12">
              <ParallaxContent>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/20"
                >
                  <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-3 sm:mb-4">Our Mission</h2>
                  <p className="font-satoshi text-sm sm:text-base text-gray-600">
                    To create the home where passionate food creators can share
                    their culinary creations, while food lovers discover authentic,
                    home-cooked meals from diverse cultural backgrounds. Where food meets its lovers.
                  </p>
                </motion.div>
              </ParallaxContent>
              <ParallaxContent>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-white/20"
                >
                  <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-3 sm:mb-4">Our Values</h2>
                  <ul className="font-satoshi text-sm sm:text-base text-gray-600 space-y-2 sm:space-y-3">
                    {["Cultural Authenticity & Diversity", "Quality & Food Safety", "Community Building", "Economic Empowerment"].map((value, index) => (
                      <motion.li
                        key={value}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-[#ff3b30] text-base sm:text-lg">•</span>
                        <span>{value}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </ParallaxContent>
            </div>
          </div>
        </section>

        {/* Link to Manifesto - Added top margin */}
        <section className="py-12 sm:py-20 mt-4 sm:mt-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-white to-gray-50" data-section-theme="light">
          <div className="max-w-7xl mx-auto text-center">
            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="font-display text-2xl sm:text-3xl text-gray-900 mb-4 sm:mb-6">
                  Read Our Manifesto
                </h2>
                <p className="font-satoshi text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                  Discover the principles and beliefs that drive us forward in our mission
                  to transform the home-cooking landscape.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/manifesto"
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-all duration-300 font-satoshi group relative overflow-hidden text-sm sm:text-base"
                  >
                    <span className="relative z-10">Read Our Manifesto</span>
                    <motion.svg
                      className="ml-2 w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </motion.svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </motion.div>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>

        {/* Team Section - Added top margin */}
        <section className="py-12 sm:py-20 mt-4 sm:mt-8 px-4 sm:px-6 lg:px-8" data-section-theme="light">
          <div className="max-w-7xl mx-auto">
            <ParallaxContent>
              <div className="text-center mb-8 sm:mb-16">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-3 sm:mb-4">
                    Crafting the Future of{" "}
                    <span className="text-[#ff3b30]">Home Dining</span>
                  </h2>
                  <p className="font-satoshi text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                    Our team brings together expertise in culinary arts, technology, and
                    community building to revolutionize the home dining experience.
                  </p>
                </motion.div>
              </div>
            </ParallaxContent>


            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8 sm:mt-16 text-center"
              >
                <Link
                  href="/cooking"
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-satoshi group relative overflow-hidden text-sm sm:text-base"
                >
                  <span className="relative z-10">Join Our Team</span>
                  <motion.svg
                    className="ml-2 w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </motion.svg>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>
      </div>
    </div>
  );
} 