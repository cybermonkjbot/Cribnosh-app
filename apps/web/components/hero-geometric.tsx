"use client"

import { Mascot } from "@/components/mascot";
import { CircularPlayButton, VideoPlayer } from "@/components/ui/video-player";
import { useMobileDevice } from "@/hooks/use-mobile-device";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion, Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/20",
  isMobile = false,
}: {
  className?: string
  delay?: number
  width?: number
  height?: number
  rotate?: number
  gradient?: string
  isMobile?: boolean
}) {
  const deviceInfo = useMobileDevice();
  const isOnMobileDevice = deviceInfo.isMobile || deviceInfo.isTablet;

  // Reduce blur and animation complexity on mobile
  const blurClass = isOnMobileDevice ? "blur-lg" : "blur-3xl";
  const duration = isOnMobileDevice ? 0.2 : 1.5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: isOnMobileDevice ? 0.9 : 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration,
        delay: isOnMobileDevice ? delay * 0.2 : delay, // Faster animations on mobile
        ease: "easeOut",
      }}
      className={cn("absolute", className)}
      style={{
        width: isMobile ? width * 0.7 : width, // Reduce size on mobile
        height: isMobile ? height * 0.7 : height,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div
        className={cn(
          "w-full h-full rounded-[30%] bg-gradient-to-br",
          gradient,
          blurClass
        )}
      />
    </motion.div>
  )
}

export default function HeroGeometric({
  badge = " ",
  title1 = "Taste your culture,",
  title2 = "your way",
  subtitle = "Where every meal is a love story",
  className,
  fullScreen = false,
}: {
  badge?: string
  title1?: string
  title2?: string
  subtitle?: string
  className?: string
  fullScreen?: boolean
}) {
  const [showNotice, setShowNotice] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const deviceInfo = useMobileDevice();
  const isOnMobileDevice = deviceInfo.isMobile || deviceInfo.isTablet;

  useEffect(() => {
    // Setup intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setShowNotice(true);
          } else {
            setShowNotice(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    const section = document.querySelector('[data-section="dining-assistant"]');
    if (section) {
      observer.observe(section);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: isOnMobileDevice ? 10 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isOnMobileDevice ? 0.2 : 1,
        delay: isOnMobileDevice ? 0.1 : 0.5,
        ease: "easeOut",
      },
    },
  }

  const handlePlayVideo = () => {
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
  };

  return (
    <div
      data-section="dining-assistant"
      data-section-theme="brand"
      className={cn(
        "relative w-full flex items-center justify-center overflow-hidden",
        fullScreen ? "h-[100vh] -mt-[var(--header-height)]" : "min-h-[140vh]",
        className
      )}
    >
      {/* Floating Notice */}
      <AnimatePresence>
        {showNotice && (
          <motion.div
            initial={{ opacity: 0, y: isOnMobileDevice ? 10 : 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isOnMobileDevice ? 10 : 50 }}
            transition={{ duration: isOnMobileDevice ? 0.2 : 0.5 }}
            className={cn(
              "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
              "bg-white/10",
              isOnMobileDevice ? "" : "backdrop-blur-sm",
              "px-4 py-2 rounded-full",
              "flex items-center whitespace-nowrap text-sm text-white/60"
            )}
          >
            {isOnMobileDevice ? (
              <>
                Try this
                <Link
                  href="/try-it"
                  className="ml-2 bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors rounded-full px-3 py-0.5 text-white/80"
                >
                  Menu
                </Link>
              </>
            ) : (
              "Right click to order"
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark background overlay - reduced opacity on mobile */}
      <div className={cn(
        "absolute inset-0",
        isOnMobileDevice ? "bg-black/70" : "bg-black/80"
      )} />

      {/* Gradient background - simplified on mobile */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-[#ff3b30]/[0.15] via-transparent to-[#ff5e54]/[0.15]",
        isOnMobileDevice ? "blur-xl" : "blur-3xl"
      )} />

      <div className="absolute inset-0 overflow-hidden">
        {/* Conditionally render fewer shapes on mobile */}
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-[#ff3b30]/[0.25]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
          isMobile={isOnMobileDevice}
        />

        {!isOnMobileDevice && (
          <ElegantShape
            delay={0.5}
            width={500}
            height={120}
            rotate={-15}
            gradient="from-[#ff5e54]/[0.25]"
            className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
            isMobile={isOnMobileDevice}
          />
        )}

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-[#ff3b30]/[0.25]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
          isMobile={isOnMobileDevice}
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-[#ff5e54]/[0.25]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-[#ff3b30]/[0.25]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]">

          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0 }}
              className="mb-14 md:mb-18"
            >
              <Mascot
                emotion="excited"
                size={isOnMobileDevice ? 80 : 100}
                className="mx-auto lg:mx-0"
              />
            </motion.div>

            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="mb-10 md:mb-14"
            >
              <CircularPlayButton
                onClick={handlePlayVideo}
                size="lg"
                className="mx-auto lg:mx-0"
              />
            </motion.div>

            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl font-bold mb-8 md:mb-10 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/90">{title1}</span>
                <br />
                <span
                  className={cn(
                    "bg-clip-text text-transparent bg-gradient-to-r from-[#ff3b30] via-white/95 to-[#ff5e54]",
                    "font-display font-bold italic"
                  )}
                >
                  {title2}
                </span>
              </h1>
            </motion.div>

            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
            >
              <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-10 sm:mb-12 leading-relaxed font-light tracking-wide max-w-2xl lg:max-w-none mx-auto lg:mx-0 px-4 lg:px-0">
                {subtitle}
              </p>
            </motion.div>
          </div>

          {/* Right Column - Image Placeholder */}
          <div className="flex items-center justify-center">
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl aspect-square rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10"
            >
              {/* Placeholder for your image - replace this with your actual image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/40">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Add your image here</p>
                </div>
              </div>


              <Image
                src="/images/mockup.png"
                alt="CribNosh App Experience Preview"
                fill
                className="object-cover"
                priority
              />

            </motion.div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm pt-16"
            onClick={closeVideoModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl mx-4 aspect-video"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeVideoModal}
                className="absolute -top-12 right-0 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <VideoPlayer
                src="/videos/cribnosh-intro.mp4"
                poster="/images/video-poster.jpg"
                showControls={true}
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/90 pointer-events-none" />
    </div>
  )
}
