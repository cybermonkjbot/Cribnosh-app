"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

type CityTextFlipProps = {
  words: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  staticText?: boolean;
};

/**
 * Displays a sequence of words with a vertical flip animation, cycling through them at a configurable interval.
 *
 * If `staticText` is true or the `words` array has one or no elements, renders a static span with the first word for SEO or performance optimization. Otherwise, animates transitions between words using a fade and vertical slide effect.
 *
 * @param words - The array of words to display in sequence.
 * @param interval - Optional duration in milliseconds between word flips; defaults to 5000.
 * @param className - Optional additional CSS classes for the container.
 * @param textClassName - Optional additional CSS classes for the text span.
 * @param staticText - Optional flag to disable animation and render static text; defaults to false.
 * @returns A React element displaying animated or static text based on the provided props.
 */
export function CityTextFlip({
  words,
  interval = 5000, // Longer interval for less frequent flipping
  className,
  textClassName,
  staticText = false, // Option to disable animation for SEO/performance
}: CityTextFlipProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // For SEO and performance, allow static text mode
  if (staticText || words.length <= 1) {
    return (
      <div className={cn("inline-block", className)}>
        <span className={cn("text-current", textClassName)}>
          {words[0] || ""}
        </span>
      </div>
    );
  }

  // Effect for word rotation
  useEffect(() => {
    // Skip animation for server-side rendering
    if (typeof window === "undefined") return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up the interval for word rotation
    intervalRef.current = setInterval(() => {
      setIsVisible(false);
      
      // After exit animation completes, change the word and fade in
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsVisible(true);
      }, 300); // Match the exit animation duration
    }, interval);

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [words, interval]);

  return (
    <div className={cn("inline-block overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="inline-block"
          >
            <span className={cn("text-current", textClassName)}>
              {words[currentIndex]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 