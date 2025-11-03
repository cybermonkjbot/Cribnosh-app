"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { CityTextFlip } from "@/components/ui/city-text-flip";
import { cn } from "@/lib/utils";

type CityHeroProps = {
  city: string;
  className?: string;
};

// Precomputed city colors for performance
const cityColors: Record<string, { from: string; to: string }> = {
  Birmingham: { from: "#ff3b30", to: "#ff5e54" },
  Leicester: { from: "#ff3b30", to: "#ff5e54" },
  Nottingham: { from: "#ff3b30", to: "#ff5e54" },
  Coventry: { from: "#ff3b30", to: "#ff5e54" },
  "Stoke-on-Trent": { from: "#ff3b30", to: "#ff5e54" },
  Derby: { from: "#ff3b30", to: "#ff5e54" },
  Wolverhampton: { from: "#ff3b30", to: "#ff5e54" },
  Northampton: { from: "#ff3b30", to: "#ff5e54" },
};

/**
 * Renders a city-specific animated hero section with responsive design and scroll-based parallax effects.
 *
 * Displays a dynamic heading, emotional copy, and cycling secondary messages tailored to the provided city, along with a call-to-action button and feature highlights. The background and accent elements use city-specific color gradients and animations, adapting layout and effects for mobile and desktop screens.
 *
 * @param city - The name of the city to personalize the hero section for
 * @param className - Optional additional CSS classes for the section
 * @returns A React component rendering the animated city hero section
 */
export function CityHero({ city, className }: CityHeroProps) {
  const { scrollYProgress } = useScroll();
  const [isMobile, setIsMobile] = useState(false);
  
  // Single emotional copy phrase with city name - no flipping
  const emotionalCopy = useMemo(() => 
    `We're crafting the taste OS that knows your mood before you do, and it's coming to ${city}.`, 
    [city]
  );
  
  // Secondary messaging with less frequent flipping
  const secondaryMessages = useMemo(() => [
    `Bringing personalized home-cooked meals to ${city}.`,
    `Connecting food creators with food lovers in ${city}.`,
    `Where food meets its lovers in ${city}.`
  ], [city]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Optimize scroll transform calculations for mobile
  const y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -25 : -150]);
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -10 : -50]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -15 : -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, isMobile ? 0.98 : 0.9]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, isMobile ? 1 : 1.02]);

  // Get city-specific colors or default to Birmingham colors
  const colors = cityColors[city] || cityColors.Birmingham;

  return (
    <motion.section 
      data-section-theme="brand"
      className={cn(
        "relative bg-gradient-to-br text-white min-h-[100vh] sm:h-screen w-full flex items-center", 
        className
      )}
      style={{ 
        background: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`,
        y, 
        opacity, 
        scale
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: isMobile ? 0.1 : 0.5 }}
    >
      {/* Background elements with independent parallax - conditionally render for mobile */}
      {!isMobile && (
      <motion.div 
        className="absolute inset-0 overflow-hidden z-0"
        style={{ y: bgY1 }}
      >
        <motion.div 
          className="absolute -right-40 -bottom-40 w-[600px] h-[600px] rounded-full bg-[#ff3b30]/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ y: bgY2 }}
        />
        <motion.div 
          className="absolute -left-20 top-40 w-[300px] h-[300px] rounded-full bg-[#ff3b30]/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
        />
      </motion.div>
      )}

      <div className={cn(
        "container mx-auto px-4 sm:px-6 relative z-10",
        "pt-24 sm:pt-32 md:pt-48",
        "pb-20 sm:pb-24 md:pb-32"
      )}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="flex flex-col items-start">
            <motion.div 
              className="mb-4 sm:mb-6 inline-block self-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs sm:text-sm uppercase tracking-widest font-medium bg-[#105D38] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                Coming Soon to {city}
              </span>
            </motion.div>

            {/* Add main heading for Coventry's Food Revolution */}
            <motion.h1
              className="mb-2 sm:mb-4 font-display font-extrabold text-white text-3xl sm:text-5xl md:text-6xl lg:text-7xl drop-shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              {city === "Coventry" ? "Coventry's Food Revolution" : `${city}'s Food Revolution`}
            </motion.h1>

            <motion.div 
              className="mb-4 sm:mb-6 self-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className={cn(
                "font-display font-bold leading-tight text-white/95",
                "text-3xl sm:text-4xl md:text-5xl lg:text-7xl"
              )}>We understand</span>
            </motion.div>

            <motion.div
              className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="font-satoshi text-white/90">{emotionalCopy}</p>
              <div className="mt-4">
                <CityTextFlip 
                  words={secondaryMessages} 
                  interval={6000}
                  className="!bg-transparent !shadow-none !text-white/90 !text-base sm:!text-lg"
                  textClassName="font-satoshi"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/waitlist">
                <motion.button
                  className="px-8 py-3 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-[#ff5e54]/90 transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ color: colors.from }}
                >
                  Join {city} Waitlist
                </motion.button>
              </Link>
            </motion.div>
          </div>

          <div className="relative ml-0 lg:ml-12 overflow-visible">
            <motion.div
              className="relative z-10 p-6 rounded-xl bg-[#ff3b30]/10 backdrop-blur-md"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h3 className="text-2xl font-display font-bold mb-4 text-white/95">We are building the emotion engine that helps you eat better</h3>
              <p className="mb-4 text-white/85">
                CribNosh is the first meal platform where food is cooked in verified home kitchens 
                and built around your identity, not the algorithm.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#ff3b30]/10 p-4 rounded-lg shadow-lg backdrop-blur-md">
                  <h4 className="font-bold text-white text-lg md:text-xl drop-shadow-sm">Real chefs</h4>
                  <p className="text-sm md:text-base text-white/95 font-medium leading-relaxed drop-shadow-sm">Authentic home cooking from verified local kitchens</p>
                </div>
                <div className="bg-[#ff3b30]/10 p-4 rounded-lg shadow-lg backdrop-blur-md">
                  <h4 className="font-bold text-white text-lg md:text-xl drop-shadow-sm">Your exact taste</h4>
                  <p className="text-sm md:text-base text-white/95 font-medium leading-relaxed drop-shadow-sm">Food that understands your preferences and mood</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#ff3b30]/5 rounded-full blur-xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
