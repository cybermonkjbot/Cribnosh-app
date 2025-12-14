"use client";

import { MasonryBackground } from '@/components/ui/masonry-background';
import { ParallaxContent } from '@/components/ui/parallax-section';
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function WorkWithCribnosh() {
  const isMobile = useMobileDevice();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <MasonryBackground className="z-0" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 sm:pt-40 pb-6 sm:pb-20 px-4 sm:px-6 lg:px-8" data-section-theme="light">
          <div className="max-w-7xl mx-auto">
            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="font-asgard text-[2rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-3 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-[#ff3b30] to-gray-900">
                  Join Our Community
                  <span className="block text-[#ff3b30] text-[1.75rem] sm:text-5xl mt-1 sm:mt-0">Shape the Future of Dining</span>
                </h1>
                <p className="font-satoshi text-base sm:text-xl text-gray-600 max-w-3xl leading-snug sm:leading-normal">
                  Whether you're a passionate chef or a reliable driver, become part of our growing
                  community and help revolutionize the home dining experience.
                </p>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>

        {/* Opportunities Section */}
        <section className="py-8 sm:py-20 px-4 sm:px-6 lg:px-8" data-section-theme="light">
          <div className="max-w-7xl mx-auto">
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'md:grid-cols-2 gap-8 sm:gap-12'}`}>
              <ParallaxContent>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group w-[95%] sm:w-full mx-auto"
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 
                      flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h2 className="font-asgard text-xl sm:text-3xl text-gray-900 group-hover:text-[#ff3b30] transition-colors">Cook on Cribnosh</h2>
                  </div>
                  <p className="font-satoshi text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Share your culinary passion with food enthusiasts in your area. Set your own menu, prices, and schedule.</p>
                  <Link
                    href="/cooking/apply"
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-all duration-300 font-satoshi group relative overflow-hidden"
                  >
                    <span className="relative z-10">Start Cooking</span>
                    <motion.svg
                      className="ml-2 w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </motion.div>
              </ParallaxContent>

              <ParallaxContent>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white/70 backdrop-blur-lg rounded-2xl p-4 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group w-[95%] sm:w-full mx-auto"
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 
                      flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="font-asgard text-xl sm:text-3xl text-gray-900 group-hover:text-[#ff3b30] transition-colors">Become a Driver</h2>
                  </div>
                  <p className="font-satoshi text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Deliver joy to customers' doorsteps. Flexible hours, great earnings, and the freedom to choose your schedule.</p>
                  <Link
                    href="/driving/apply"
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-all duration-300 font-satoshi group relative overflow-hidden"
                  >
                    <span className="relative z-10">Start Driving</span>
                    <motion.svg
                      className="ml-2 w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </motion.div>
              </ParallaxContent>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-white to-gray-50" data-section-theme="light">
          <div className="max-w-7xl mx-auto text-center">
            <ParallaxContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 sm:p-8 shadow-lg border border-white/20"
              >
                <h2 className="font-asgard text-xl sm:text-3xl text-gray-900 mb-4 sm:mb-6">
                  Looking for Other Opportunities?
                </h2>
                <p className="font-satoshi text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join our team and help build the future of home dining technology.
                  We're always looking for talented individuals across various roles.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/careers"
                    className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-300 font-satoshi group relative overflow-hidden"
                  >
                    <span className="relative z-10">Explore Careers</span>
                    <motion.svg
                      className="ml-2 w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </motion.svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </motion.div>
              </motion.div>
            </ParallaxContent>
          </div>
        </section>
      </div>
    </main>
  );
} 