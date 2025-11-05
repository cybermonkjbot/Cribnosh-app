"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { useEffect, useState } from "react";

const perks = [
  {
    id: 1,
    image: "/early-access-perks/1.png",
    title: "Early Bird Rewards",
    description: "Get exclusive access to special promotions and rewards before anyone else."
  },
  {
    id: 2,
    image: "/early-access-perks/2.png",
    title: "Priority Booking",
    description: "Book your favorite Food Creators before their schedules fill up."
  },
  {
    id: 3,
    image: "/early-access-perks/3.png",
    title: "Community Events",
    description: "Join exclusive tasting events and culinary workshops."
  },
  {
    id: 4,
    image: "/early-access-perks/4.png",
    title: "Personalized Experience",
    description: "Get customized recommendations based on your taste preferences."
  }
];

export default function EarlyAccessPerks() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <main className="relative">
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] opacity-90" />
        </ParallaxLayer>
        
        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-40" />
          </div>
        </ParallaxLayer>

        {/* Content layer */}
        <div className="relative z-10">
          <section 
            data-section-theme="brand" 
            className="min-h-screen pt-24 pb-32 full-screen-section"
          >
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
              {/* Left side - Masonry Gallery */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-8 order-2 lg:order-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
                  {perks.map((perk, index) => (
                    <motion.div
                      key={perk.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={`relative overflow-hidden rounded-2xl ${
                        index % 3 === 0 ? 'sm:col-span-2' : 'col-span-1'
                      }`}
                    >
                      <div className="relative aspect-[4/3] group">
                        <Image
                          src={perk.image}
                          alt={perk.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <h3 className="text-base sm:text-lg font-bold">{perk.title}</h3>
                          <p className="text-xs sm:text-sm text-white/80">{perk.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right side - Content */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full lg:w-1/2 bg-white px-6 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 flex flex-col rounded-t-3xl lg:rounded-t-none lg:rounded-l-3xl order-1 lg:order-2"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="max-w-xl w-full"
                >
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] bg-clip-text text-transparent">
                    Early Access Perks
                  </h1>
                  <p className="text-lg sm:text-xl text-neutral-600 mb-6 sm:mb-10">
                    Join our early access program and unlock exclusive benefits that enhance your culinary journey.
                  </p>

                  <div className="space-y-6 sm:space-y-8">
                    {perks.map((perk, index) => (
                      <motion.div
                        key={perk.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                        className="flex items-start space-x-3 sm:space-x-4"
                      >
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                          <span className="text-lg sm:text-2xl font-semibold text-[#ff3b30]">{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-1">
                            {perk.title}
                          </h3>
                          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                            {perk.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-8 sm:mt-10"
                  >
                    <Link 
                      href="/waitlist"
                      className="inline-block w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#ff3b30] text-white rounded-xl font-medium hover:bg-[#ff5e54] transition-colors duration-300 shadow-lg hover:shadow-xl text-center"
                    >
                      Join Early Access
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </div>
      </ParallaxGroup>
    </main>
  );
} 