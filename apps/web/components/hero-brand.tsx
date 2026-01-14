"use client";

import { CategoryPreview } from "@/components/ui/category-preview";
import { ContainerTextFlip } from "@/components/ui/containedtextflip";
import { useMobileDevice } from "@/hooks/use-mobile-device";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { HeroBrandPage2 } from "./hero-brand-page-2";
import { HeroBrandPage3 } from "./hero-brand-page-3";

// Define the valid category types
type CategoryType =
  | "Vibrant Flavors"
  | "Hygienic Standards"
  | "Cultural Roots"
  | "Family Traditions"
  | "Healthy Choices"
  | "Sustainable Practices";

export function HeroBrand({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const [hoveredCategory, setHoveredCategory] = useState<CategoryType | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1);
  const { isMobile } = useMobileDevice();
  const [touchTimeout, setTouchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [autoSwitchPaused, setAutoSwitchPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Handle iPhone interactions
  const handleIPhoneInteractionStart = () => {
    setAutoSwitchPaused(true);
  };

  const handleIPhoneInteractionEnd = () => {
    // Add a delay before resuming to prevent immediate switching
    setTimeout(() => {
      setAutoSwitchPaused(false);
    }, 2000); // Longer delay for iPhone interactions
  };

  // Pause auto-switch when category is being hovered
  useEffect(() => {
    if (hoveredCategory) {
      setAutoSwitchPaused(true);
    } else {
      // Add a small delay before resuming to prevent immediate switching
      const timeout = setTimeout(() => {
        setAutoSwitchPaused(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [hoveredCategory]);

  // Auto-switch pages effect
  useEffect(() => {
    const switchInterval = setInterval(() => {
      if (!autoSwitchPaused) {
        setCurrentPage(current => {
          if (current === 1) return 2;
          if (current === 2) return 3;
          return 1;
        });
      }
    }, 3000); // Switch every 3 seconds

    return () => clearInterval(switchInterval);
  }, [autoSwitchPaused]);

  // Pause auto-switch when user interacts with navigation
  const handleManualPageChange = (page: 1 | 2 | 3) => {
    setCurrentPage(page);
    setAutoSwitchPaused(true);
    // Resume auto-switch after 15 seconds of no interaction
    setTimeout(() => {
      setAutoSwitchPaused(false);
    }, 15000);
  };



  // Clear any existing touch timeout when component unmounts
  useEffect(() => {
    return () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }
    };
  }, [touchTimeout]);

  const handleTouchStart = (value: CategoryType, e: React.TouchEvent) => {
    const touch = e.touches[0];
    setHoveredCategory(value);
    setMousePosition({ x: touch.clientX, y: touch.clientY - 20 });
    setAutoSwitchPaused(true);

    // Clear any existing timeout
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }

    // Set a shorter timeout for mobile to improve responsiveness
    const timeout = setTimeout(() => {
      setHoveredCategory(null);
      // Add delay before resuming auto-switch
      setTimeout(() => {
        setAutoSwitchPaused(false);
      }, 1000);
    }, isMobile ? 1500 : 3000);
    setTouchTimeout(timeout);
  };

  const handleTouchMove = (value: CategoryType, e: React.TouchEvent) => {
    if (hoveredCategory === value) {
      const touch = e.touches[0];
      setMousePosition({ x: touch.clientX, y: touch.clientY - 20 });
    }
  };

  const handleTouchEnd = () => {
    // Don't immediately clear the preview - let the timeout handle it
    // This allows users to see the preview after lifting their finger
  };

  // Optimize scroll transform calculations for mobile
  const y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -25 : -150]);
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -10 : -50]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -15 : -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, isMobile ? 0.98 : 0.9]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, isMobile ? 1 : 1.02]);

  // Optimize animation durations for mobile
  const getAnimationDuration = () => isMobile ? 0.1 : 0.5;
  const getAnimationDelay = (baseDelay: number) => isMobile ? baseDelay * 0.2 : baseDelay;

  const brandValues: Array<{
    text: CategoryType;
    delay: number;
    cursorText: string;
    href: string;
  }> = [
      {
        text: "Vibrant Flavors",
        delay: isMobile ? 0.04 : 0.2,
        cursorText: "Experience bold, authentic tastes from around the world",
        href: "/values/vibrant-flavors"
      },
      {
        text: "Hygienic Standards",
        delay: isMobile ? 0.06 : 0.3,
        cursorText: "Every kitchen certified to the highest safety standards",
        href: "/values/hygienic-standards"
      },
      {
        text: "Cultural Roots",
        delay: isMobile ? 0.08 : 0.4,
        cursorText: "Preserving authentic recipes and cooking traditions",
        href: "/values/cultural-roots"
      },
      {
        text: "Family Traditions",
        delay: isMobile ? 0.1 : 0.5,
        cursorText: "Recipes passed down through generations",
        href: "/values/family-traditions"
      },
      {
        text: "Healthy Choices",
        delay: isMobile ? 0.12 : 0.6,
        cursorText: "Nutritious meals tailored to your dietary needs",
        href: "/values/healthy-choices"
      },
      {
        text: "Sustainable Practices",
        delay: isMobile ? 0.14 : 0.7,
        cursorText: "Eco-friendly cooking with local ingredients",
        href: "/values/sustainable-practices"
      }
    ];

  // Track scroll position to hide/show navigation
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((value) => {
      // Hide buttons when scrolled more than 30% of the hero section
      setIsVisible(value < 0.3);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setAutoSwitchPaused(true)}
      onMouseLeave={() => {
        // Only resume if no category is being hovered
        if (!hoveredCategory) {
          setTimeout(() => {
            setAutoSwitchPaused(false);
          }, 1000);
        }
      }}
    >
      <AnimatePresence mode="wait">
        {currentPage === 1 ? (
          <motion.section
            key="page1"
            data-section-theme="brand"
            className={cn(
              "relative bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-white min-h-screen w-full flex items-center justify-center overflow-hidden",
              className
            )}
            style={{ y, opacity, scale }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
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
                    transition={{ duration: getAnimationDuration() }}
                  >
                    <span className="text-sm sm:text-base uppercase tracking-widest font-medium bg-white/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full">
                      We are making
                    </span>
                  </motion.div>

                  <motion.div
                    className="mb-6 sm:mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: getAnimationDuration(), delay: getAnimationDelay(0.1) }}
                  >
                    {!isMobile && (
                      <ContainerTextFlip
                        words={["Authentic", "Creative", "Inspired", "Personal"]}
                        interval={2500}
                        className="!bg-[#ff3b30]/50 !shadow-none !text-white"
                        textClassName="font-display font-bold"
                      />
                    )}
                    {!isMobile && <br />}
                    <span className={cn(
                      "font-display font-bold leading-tight text-white/90",
                      "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                    )}>Dining, Redefined</span>
                  </motion.div>

                  <motion.p
                    className="text-lg sm:text-xl md:text-2xl text-white/80 mb-10 sm:mb-12 max-w-lg"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: getAnimationDuration(), delay: getAnimationDelay(0.2) }}
                  >
                    CribNosh is the home of <span className="text-[#00FF88] font-semibold bg-[#00FF88]/10 px-2 py-1 rounded-md transition-all duration-300 hover:text-[#00FF88]/80 hover:bg-[#00FF88]/30 hover:rotate-2 hover:px-3 hover:py-1.5 cursor-pointer" style={{ display: 'inline-block' }}>food creators</span> and <span className="text-[#00B4FF] font-semibold bg-[#00B4FF]/10 px-2 py-1 rounded-md transition-all duration-300 hover:text-[#00B4FF]/80 hover:bg-[#00B4FF]/30 hover:-rotate-1 hover:px-3 hover:py-1.5 cursor-pointer" style={{ display: 'inline-block' }}>foodies</span>, where food meets its lovers.
                    We're building the first meal platform where food is cooked in verified home kitchens and built around your identity, not the algorithm.
                  </motion.p>



                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: getAnimationDuration(), delay: getAnimationDelay(0.3) }}
                    data-cursor-text="Get exclusive perks and early access benefits"
                  >
                    <Link href="/waitlist">
                      <motion.button
                        className="px-10 py-4 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors text-lg sm:text-xl"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Get Early Access
                      </motion.button>
                    </Link>
                  </motion.div>

                  {/* Mobile App Screenshot */}
                  {isMobile && (
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: getAnimationDuration(), delay: getAnimationDelay(0.4) }}
                      className="mt-12 flex justify-center px-4"
                    >
                      <div className="relative w-72 aspect-[9/19.5] rounded-3xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-3 transition-transform duration-300">
                        {!imageError ? (
                          <Image
                            src="/mobilemockstatic.png"
                            alt="CribNosh Mobile App"
                            width={288}
                            height={624}
                            className="w-full h-full object-cover object-center"
                            priority
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#ff3b30]/20 to-[#ff5e54]/20 flex items-center justify-center">
                            <div className="text-white/60 text-sm text-center px-4">
                              CribNosh Mobile App
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 via-transparent to-transparent pointer-events-none" />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="relative ml-0 lg:ml-12 overflow-visible">
                  {/* Brand values section - desktop only */}
                  {!isMobile && (
                    <div className="relative z-10">
                      {brandValues.map((value, index) => (
                        <motion.div
                          key={index}
                          className="mb-4 relative"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.7, delay: value.delay }}
                          data-cursor-text={value.cursorText}
                          onTouchStart={isMobile ? (e) => handleTouchStart(value.text, e) : undefined}
                          onTouchMove={isMobile ? (e) => handleTouchMove(value.text, e) : undefined}
                          onTouchEnd={isMobile ? handleTouchEnd : undefined}
                        >
                          <Link
                            href={value.href}
                            className="inline-block"
                            onMouseEnter={(e) => {
                              setHoveredCategory(value.text);
                              setMousePosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => {
                              if (hoveredCategory === value.text) {
                                setMousePosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            onMouseLeave={() => setHoveredCategory(null)}
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
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <motion.div
                    className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#ff2920]/10 rounded-full blur-xl"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </div>
              </div>
            </div>
            {/* Floating Preview */}
            <AnimatePresence>
              {hoveredCategory && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="fixed pointer-events-none z-20"
                  style={{
                    left: mousePosition.x,
                    top: mousePosition.y,
                    transform: 'translate(-50%, 20px)'
                  }}
                >
                  <motion.div
                    className="relative"
                    initial={{ y: -10 }}
                    animate={{ y: 0 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b30]/20 via-purple-500/10 to-transparent blur-xl -z-10" />
                    <CategoryPreview category={hoveredCategory} />
                    {isMobile && (
                      <Link
                        href={brandValues.find(v => v.text === hoveredCategory)?.href || '#'}
                        className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-sm rounded-full p-2 pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredCategory(null);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        ) : currentPage === 2 ? (
          <HeroBrandPage2
            key="page2"
            className={className}
            onInteractionStart={handleIPhoneInteractionStart}
            onInteractionEnd={handleIPhoneInteractionEnd}
          />
        ) : (
          <HeroBrandPage3
            key="page3"
            className={className}
          />
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed bottom-24 right-4 sm:right-8 flex gap-4 z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.button
              className={cn(
                "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
                "bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(currentPage === 1 ? 3 : (currentPage - 1) as 1 | 2 | 3)}
              aria-label="Previous hero view"
              style={{ pointerEvents: "auto", zIndex: 999 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </motion.button>
            <motion.button
              className={cn(
                "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
                "bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(currentPage === 3 ? 1 : (currentPage + 1) as 1 | 2 | 3)}
              aria-label="Next hero view"
              style={{ pointerEvents: "auto", zIndex: 999 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
