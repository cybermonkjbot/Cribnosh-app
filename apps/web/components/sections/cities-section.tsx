"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

/**
 * Displays a spotlight section for the launch city (Edinburgh).
 *
 * Replaces the previous grid of cities with a focused 2-column layout:
 * - Left: Text content (Headline, Description, CTA)
 * - Right: Transparent image of the city
 *
 * @param isHome - If true, applies specific styling for the home page context.
 */
export function CitiesSection({ isHome = false }: { isHome?: boolean } = {}) {
  return (
    <div className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-collg:flex-row items-center gap-12 lg:gap-24">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex-1 text-center lg:text-left z-10"
          >
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] font-semibold text-sm">
              Launch City
            </div>

            <h2 className={`font-asgard text-4xl md:text-6xl font-bold mb-6 ${isHome ? 'text-gray-900' : 'text-white'}`}>
              Edinburgh, we're<br />
              <span className="text-[#ff3b30]">coming for you.</span>
            </h2>

            <p className={`font-satoshi text-lg md:text-xl leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0 ${isHome ? 'text-gray-600' : 'text-gray-300'}`}>
              The historic streets of Scotland's capital will be the first to taste the future of dining.
              From the Old Town to Leith, we're bringing local chefs and AI-powered personalization
              directly to your door.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/launch/edinburgh"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-[#ff3b30] rounded-full hover:bg-[#ff5e54] transition-all duration-300 shadow-lg hover:shadow-[#ff3b30]/25"
              >
                <span>Explore the Launch</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/waitlist"
                className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full border-2 transition-all duration-300 ${isHome ? 'border-gray-200 text-gray-900 hover:border-gray-900' : 'border-white/20 text-white hover:bg-white/10'}`}
              >
                Join Waitlist
              </Link>

              <Link
                href="/expansions"
                className={`inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 ${isHome ? 'text-gray-500 hover:text-[#ff3b30]' : 'text-white/60 hover:text-white'}`}
              >
                Expansions
              </Link>
            </div>
          </motion.div>

          {/* Image Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex-1 relative w-full max-w-lg lg:max-w-none"
          >
            <div className="relative aspect-square md:aspect-[4/3] w-full">
              {/* Decorative blob behind image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#ff3b30]/20 to-transparent rounded-full blur-3xl transform scale-90 translate-y-4" />

              <Image
                src="/edingburghcity.png"
                alt="Edinburgh City Highlight"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}