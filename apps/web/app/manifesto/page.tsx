"use client";

import Link from "next/link";
import { MasonryBackground } from "@/components/ui/masonry-background";
import { ParallaxSection, ParallaxContent } from "@/components/ui/parallax-section";
import { motion } from "motion/react";

export default function ManifestoPage() {
  const principles = [
    {
      title: "Authenticity First",
      description:
        "We believe in preserving and celebrating the authentic flavors and traditions of home cooking from every culture.",
    },
    {
      title: "Community at Heart",
      description:
        "Building meaningful connections between chefs and food lovers, creating a vibrant ecosystem of shared culinary experiences.",
    },
    {
      title: "Economic Empowerment",
      description:
        "Enabling passionate Food Creators to turn their culinary skills into sustainable business opportunities.",
    },
    {
      title: "Quality & Safety",
      description:
        "Maintaining the highest standards of food safety while ensuring exceptional quality in every meal.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MasonryBackground className="z-0" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8" data-section-theme="light">
          <div className="max-w-7xl mx-auto">
            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                  Our Manifesto
                </h1>
                <p className="font-satoshi text-xl text-gray-600 max-w-3xl">
                  A declaration of our commitment to revolutionize home cooking,
                  empower chefs, and bring communities together through food.
                </p>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20 px-4 sm:px-6 lg:px-8" data-section-theme="light">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {principles.map((principle, index) => (
                <ParallaxContent key={principle.title}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group"
                  >
                    <motion.div
                      initial={{ x: -20 }}
                      animate={{ x: 0 }}
                      transition={{ delay: index * 0.2 + 0.2 }}
                    >
                      <h2 className="font-display text-3xl text-gray-900 mb-4 group-hover:text-[#ff3b30] transition-colors">
                        {principle.title}
                      </h2>
                      <p className="font-satoshi text-gray-600">{principle.description}</p>
                    </motion.div>
                  </motion.div>
                </ParallaxContent>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-white to-gray-50" data-section-theme="light">
          <div className="max-w-7xl mx-auto text-center">
            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-lg border border-white/20"
              >
                <h2 className="font-display text-3xl text-gray-900 mb-6">
                  Join Our Movement
                </h2>
                <p className="font-satoshi text-gray-600 mb-8 max-w-2xl mx-auto">
                  Whether you're a passionate Food Creator or a food enthusiast, become
                  part of our growing community and help shape the future of home
                  cooking.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/cooking"
                      className="inline-flex items-center px-6 py-3 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-all duration-300 font-satoshi group relative overflow-hidden"
                    >
                      <span className="relative z-10">Become a Chef</span>
                      <motion.svg
                        className="ml-2 w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/try-it"
                      className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-satoshi group relative overflow-hidden"
                    >
                      <span className="relative z-10">Try CribNosh</span>
                      <motion.svg
                        className="ml-2 w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
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
                </div>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>
      </div>
    </div>
  );
}
