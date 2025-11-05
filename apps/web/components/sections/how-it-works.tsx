"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MasonryBackground } from "../ui/masonry-background";
import { useMobileDevice } from "@/hooks/use-mobile-device";

/**
 * Individual step card component with image hotswapping functionality
 */
function StepCard({ step, index, isMobile }: { step: Step; index: number; isMobile: boolean }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  
  const images = [step.imagePath, step.imagePathAlt];
  
  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex: number) => (prevIndex + 1) % images.length);
    }, 3000 + (index * 500)); // Staggered timing for each card
    
    return () => clearInterval(interval);
  }, [isInView, images.length, index]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          duration: isMobile ? 0.4 : 0.7, 
          delay: isMobile ? index * 0.1 : index * 0.15,
          ease: "easeOut"
        }
      }}
      onViewportEnter={() => setIsInView(true)}
      viewport={{ once: true, margin: isMobile ? "-30px" : "-50px" }}
      whileHover={{ 
        y: -8, 
        transition: { duration: 0.3 } 
      }}
      className={`group relative overflow-hidden rounded-3xl border border-white/20 h-full flex flex-col
        ${isMobile ? 'p-4' : 'p-6'}`}
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/60 to-white/40    backdrop-blur-xl" />
      
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#ff3b30]/20 via-[#ff7b54]/20 to-[#ff3b30]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating gradient orbs */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#ff3b30]/20 to-[#ff7b54]/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-60" />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-[#ff7b54]/15 to-[#ff3b30]/15 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-700 opacity-40" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Image showcase container with hotswapping - MAIN FOCUS */}
        <div className={`relative mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100/80 to-gray-200/80 border border-gray-200/50 
          ${isMobile ? 'h-56' : 'h-64'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff3b30]/10 to-[#ff7b54]/10" />
          <div className="absolute inset-0 backdrop-blur-sm" />
          
          {/* Hotswapping PNG images */}
          <div className="relative z-10 w-full h-full">
            {images.map((imagePath, imageIndex) => (
              <motion.div
                key={imageIndex}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: currentImageIndex === imageIndex ? 1 : 0,
                  scale: currentImageIndex === imageIndex ? 1 : 0.9
                }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeInOut"
                }}
              >
                <div className="text-center w-full h-full flex items-center justify-center p-2">
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={imagePath}
                      alt={step.imageAlt}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Active image indicator dots */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, dotIndex) => (
                <div
                  key={dotIndex}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentImageIndex === dotIndex 
                      ? 'bg-gradient-to-r from-[#ff3b30] to-[#ff7b54] w-4' 
                      : 'bg-white/50 '
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
        </div>
        
        {/* Content - more compact */}
        <div className="flex flex-col h-full">
          <div className="flex-grow space-y-3">
            <h3 className={`font-['Asgard'] ${isMobile ? 'text-lg' : 'text-xl'} text-gray-900 leading-tight`}>
              {step.title}
            </h3>
            
            <p className={`font-['Satoshi'] ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 leading-relaxed`}>
              {step.description}
            </p>
          </div>
          

        </div>
      </div>
    </motion.div>
  );
}

interface Step {
  title: string;
  description: string;
  imagePath: string; // Path to the first PNG image showcasing the UI
  imagePathAlt: string; // Path to the second PNG image for hotswapping
  imageAlt: string;
}

/**
 * Renders the "How It Works" section with four visually stunning steps showcasing Cribnosh features.
 *
 * This component displays a responsive, glassmorphic design with UI showcase images, 
 * enhanced visual effects, and smooth animations that adapt for mobile and desktop devices.
 */
export function HowItWorksSection() {
  const { isMobile } = useMobileDevice();
  
  const steps: Step[] = [
    {
      title: "Let the Emotion Engine Guide You",
      description: "Not sure what to eat? Let your mood, cravings, or even a shake of your phone help you decide. Cribnosh adapts to you.",
      imagePath: "/images/features/emotion-engine-1.png",
      imagePathAlt: "/images/features/emotion-engine-2.png",
      imageAlt: "Emotion Engine UI mockup showing mood-based food suggestions"
    },
    {
      title: "Order for You or for Everyone",
      description: "Treat yourself, your friends, or your family. Group orders, gifts, and family profiles make sharing easy and fun.",
      imagePath: "/images/features/group-ordering-1.png",
      imagePathAlt: "/images/features/group-ordering-2.png",
      imageAlt: "Group ordering interface showing multiple user profiles"
    },
    {
      title: "Have Fun With It",
      description: "Follow chefs, watch live cooking, tag your mood, and discover new favorites. Every meal is an experience.",
      imagePath: "/images/features/social-features-1.png",
      imagePathAlt: "/images/features/social-features-2.png",
      imageAlt: "Social features UI with chef profiles and live cooking streams"
    },
    {
      title: "Enjoy & Share the Love",
      description: "Savor your meal, leave a sentiment, and share your experience with the community. Cribnosh is all about connection.",
      imagePath: "/images/features/community-sharing-1.png",
      imagePathAlt: "/images/features/community-sharing-2.png",
      imageAlt: "Community sharing interface with reviews and meal photos"
    },
  ];

  return (
    <div className="relative py-24 overflow-hidden">
      {/* Enhanced background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff3b30]/5 via-transparent to-[#ff7b54]/5" />
      
      {/* Custom masonry background - only load on desktop */}
      {!isMobile && (
        <div className="hidden lg:block">
          <MasonryBackground className="opacity-10" />
        </div>
      )}
      
      <div className={`mx-auto relative z-10 ${isMobile ? 'w-full px-2' : 'container px-6'}`}>
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`font-['Asgard'] ${isMobile ? 'text-4xl mb-4' : 'text-5xl md:text-6xl mb-6'} bg-gradient-to-r from-[#ff3b30] to-[#ff7b54] bg-clip-text text-transparent`}
          >
            How It Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className={`font-['Satoshi'] ${isMobile ? 'text-lg px-2' : 'text-xl md:text-2xl'} text-gray-600  max-w-3xl mx-auto leading-relaxed`}
          >
            From mood to meal in four steps.
          </motion.p>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${isMobile ? 'gap-6' : 'gap-8'}`}>
          {steps.map((step, index) => (
            <StepCard 
              key={index} 
              step={step} 
              index={index} 
              isMobile={isMobile} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}