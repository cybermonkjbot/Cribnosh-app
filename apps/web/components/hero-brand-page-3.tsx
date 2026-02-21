import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeroBrandPage3Props {
  className?: string;
}

/**
 * HeroBrandPage3: A brand hero view that matches the consistent feel of other hero components.
 */
export function HeroBrandPage3({ className }: HeroBrandPage3Props) {
  const { scrollYProgress } = useScroll();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animation transforms
  const y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -25 : -150]);
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -10 : -50]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -15 : -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, isMobile ? 0.98 : 0.9]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, isMobile ? 1 : 1.02]);

  // Brand values matching other hero components
  const brandValues = [
    { 
      text: "Food Creators", 
      delay: 0.2,
      description: "Passionate food creators sharing authentic recipes"
    },
    { 
      text: "Food Lovers", 
      delay: 0.4,
      description: "Discovering meals that match their taste and mood"
    },
    { 
      text: "Authentic Flavors", 
      delay: 0.6,
      description: "Real recipes from verified home kitchens"
    },
    { 
      text: "Personalized Experience", 
      delay: 0.8,
      description: "Food built around your identity, not algorithms"
    }
  ];

  return (
    <motion.section
      className={cn(
        "relative bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-white min-h-screen w-full flex items-center justify-center overflow-hidden",
        className
      )}
      style={{ y, opacity, scale }}
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
            className="absolute -right-40 -bottom-40 w-[600px] h-[600px] rounded-full bg-[#ff7b72]/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ y: bgY2 }}
          />
          <motion.div 
            className="absolute -left-20 top-40 w-[300px] h-[300px] rounded-full bg-[#ff2920]/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          />
        </motion.div>
      )}

      <div className={cn(
        "container mx-auto px-4 sm:px-6 relative z-10",
        "pt-24 sm:pt-28 md:pt-36",
        "pb-24 sm:pb-28 md:pb-36"
      )}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <motion.div 
              className="mb-6 sm:mb-8 inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-sm sm:text-base uppercase tracking-widest font-medium bg-white/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full">
                We are building
              </span>
            </motion.div>

            <motion.div 
              className="mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className={cn(
                "font-display font-bold leading-tight text-white/90",
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              )}>The Food Creator's Home</span>
            </motion.div>

            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-white/80 mb-10 sm:mb-12 max-w-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Where food meets its lovers. We're crafting the taste OS that knows your mood before you do, 
              connecting passionate <span className="text-[#00FFFF] font-semibold bg-[#00FFFF]/10 px-2 py-1 rounded-md transition-all duration-300 hover:text-[#00FFFF]/80 hover:bg-[#00FFFF]/30 hover:rotate-6 hover:px-3 hover:py-1.5 cursor-pointer" style={{ display: 'inline-block' }}>food creators</span> with <span className="text-[#FFFF00] font-semibold bg-[#FFFF00]/10 px-2 py-1 rounded-md transition-all duration-300 hover:text-[#FFFF00]/80 hover:bg-[#FFFF00]/30 hover:-rotate-3 hover:px-3 hover:py-1.5 cursor-pointer" style={{ display: 'inline-block' }}>food lovers</span> who crave authentic, personalized experiences.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/waitlist">
                <motion.button
                  className="px-10 py-4 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors text-lg sm:text-xl"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join the Waitlist
                </motion.button>
              </Link>
            </motion.div>

            {/* Mobile App Screenshot */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-12 flex justify-center px-4"
              >
                <div className="relative w-72 aspect-[9/19.5] rounded-3xl overflow-hidden shadow-2xl transform rotate-4 hover:rotate-5 transition-transform duration-300">
                  <img
                    src="/mobilemockstatic.png"
                    alt="CribNosh Mobile App"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 via-transparent to-transparent" />
                </div>
              </motion.div>
            )}
          </div>

          <div className="relative ml-0 lg:ml-12 overflow-visible">
            {/* Brand values section - desktop vs mobile */}
            {!isMobile && (
              <div className="relative z-10">
                {brandValues.map((value, index) => (
                  <motion.div
                    key={index}
                    className="mb-4 relative"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: value.delay }}
                  >
                    <motion.h2 
                      className="inline-block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold italic text-white/90 hover:text-white transition-colors"
                      whileHover={{
                        scale: 1.05,
                        textShadow: "0 0 8px rgba(255,255,255,0.5)",
                        transition: {
                          duration: 0.3,
                          ease: "easeInOut"
                        }
                      }}
                    >
                      {value.text}
                    </motion.h2>
                    <p className="text-sm text-white/70 mt-1 max-w-xs">{value.description}</p>
                  </motion.div>
                ))}
              </div>
            )}
            
            <motion.div
              className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#ff3b30]/10 rounded-full blur-xl"
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

