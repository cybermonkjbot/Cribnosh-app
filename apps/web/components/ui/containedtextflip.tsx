"use client";

import React, { useState, useEffect, useId, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface ContainerTextFlipProps {
  /** Array of words to cycle through in the animation */
  words?: string[];
  /** Time in milliseconds between word transitions */
  interval?: number;
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Additional CSS classes to apply to the text */
  textClassName?: string;
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number;
  /** If true, disables auto-flip and only flips on user interaction */
  manualFlip?: boolean;
  /** Optional callback when flipping to next word */
  onNext?: (nextIndex: number) => void;
}

export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 3000,
  className,
  textClassName,
  animationDuration = 700,
  manualFlip = false,
  onNext,
}: ContainerTextFlipProps) {
  const id = useId();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [width, setWidth] = useState(100);
  const textRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Improved Intersection Observer logic
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { 
        threshold: 0.3, // Trigger when 30% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation slightly before fully in view
      }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      observer.disconnect();
    };
  }, []);

  const updateWidthForWord = () => {
    if (textRef.current) {
      // Add some padding to the text width (30px on each side)
      // @ts-ignore
      const textWidth = textRef.current.scrollWidth + 30;
      setWidth(textWidth);
    }
  };

  useEffect(() => {
    updateWidthForWord();
  }, [currentWordIndex]);

  useEffect(() => {
    if (manualFlip) return;
    if (!inView) return;
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % words.length;
        if (onNext) onNext(nextIndex);
        return nextIndex;
      });
    }, interval);
    return () => clearInterval(intervalId);
  }, [words.length, interval, inView, manualFlip, !!onNext]);

  const handleNext = () => {
    setCurrentWordIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % words.length;
      if (onNext) onNext(nextIndex);
      return nextIndex;
    });
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      layoutId={`words-here-${id}`}
      animate={{ width }}
      transition={{ duration: animationDuration / 2000 }}
      className={cn(
        "relative inline-block rounded-lg pt-1 pb-2 sm:pt-2 sm:pb-3 text-center text-lg sm:text-2xl md:text-4xl lg:text-7xl font-bold text-white",
        "[background:linear-gradient(to_bottom,#133324,#094327)]",
        "shadow-[inset_0_-1px_#d1d5db,inset_0_0_0_1px_#d1d5db,_0_4px_8px_#d1d5db]",
        className,
      )}
      key={words[currentWordIndex]}
      onClick={manualFlip ? handleNext : undefined}
      onMouseEnter={manualFlip ? handleNext : undefined}
      style={{ cursor: manualFlip ? "pointer" : undefined }}
    >
      <motion.div
        transition={{
          duration: animationDuration / 1000,
          ease: "easeInOut",
        }}
        className={cn("inline-block", textClassName, "line-clamp-2")}
        ref={textRef}
        layoutId={`word-div-${words[currentWordIndex]}-${id}`}
      >
        <motion.div className="inline-block">
          {words[currentWordIndex].split("").map((letter, index) => (
            <motion.span
              key={index}
              initial={{
                opacity: 0,
                filter: "blur(10px)",
              }}
              animate={{
                opacity: 1,
                filter: "blur(0px)",
              }}
              transition={{
                delay: inView ? index * (window.innerWidth <= 768 ? 0.01 : 0.02) : 0,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
