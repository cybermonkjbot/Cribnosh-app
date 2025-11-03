"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SwappingSubtitleProps {
  phrases: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
}

export function SwappingSubtitle({ 
  phrases, 
  interval = 3000, 
  className = "", 
  textClassName = "" 
}: SwappingSubtitleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, interval);

    return () => clearInterval(timer);
  }, [phrases.length, interval]);

  if (!phrases || phrases.length === 0) {
    return <div>No phrases provided</div>;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="relative h-16 sm:h-20 md:h-24 lg:h-28 overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.4, 0.0, 0.2, 1],
              opacity: { duration: 0.4 },
              scale: { duration: 0.5 }
            }}
            className={`text-center px-4 ${textClassName}`}
          >
            {phrases[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
