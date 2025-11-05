"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, stagger, useAnimate, AnimatePresence, Variants, TargetAndTransition } from "motion/react";
import { cn } from "@/lib/utils";

export interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
  ariaLabel?: string;
  onAnimationComplete?: () => void;
  textClassName?: string;
  animationVariant?: "blur" | "fade" | "slide";
  isLoading?: boolean;
}

const variants: Record<string, Variants> = {
  blur: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slide: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
};

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  staggerDelay = 0.2,
  ariaLabel,
  onAnimationComplete,
  textClassName,
  animationVariant = "blur",
  isLoading = false,
}: TextGenerateEffectProps) => {
  const [scope, animate] = useAnimate();
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  
  // Memoize the words array to prevent unnecessary re-renders
  const wordsArray = useMemo(() => {
    return words?.trim() ? words.split(" ") : [];
  }, [words]);

  useEffect(() => {
    if (!scope.current || wordsArray.length === 0 || isLoading) return;
    
    const animateText = async () => {
      const animationTarget: TargetAndTransition = {
        opacity: 1,
        ...(animationVariant === "blur" && { filter: "blur(0px)" }),
        ...(animationVariant === "slide" && { y: 0 }),
      };

      await animate(
        "span",
        animationTarget,
        {
          duration,
          delay: stagger(staggerDelay),
        }
      );
      setIsAnimationComplete(true);
      onAnimationComplete?.();
    };

    setIsAnimationComplete(false);
    animateText();
  }, [scope, wordsArray, filter, duration, staggerDelay, animate, animationVariant, isLoading, onAnimationComplete]);

  // Handle loading state with proper Tailwind classes
  if (isLoading) {
    return (
      <div className={cn("font-bold", className)} role="status">
        <div className="mt-4">
          <div className="h-6 bg-gray-200  rounded w-3/4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Handle empty words
  if (wordsArray.length === 0) {
    return null;
  }

  const renderWords = () => {
    return (
      <AnimatePresence>
        <motion.div 
          ref={scope} 
          aria-label={ariaLabel || words}
          className={cn(
            "transition-colors duration-200",
            isAnimationComplete ? "text-black " : "text-gray-800 "
          )}
        >
          {wordsArray.map((word, idx) => {
            const initialStyle = {
              opacity: 0,
              ...(animationVariant === "blur" && { filter: "blur(10px)" }),
              ...(animationVariant === "slide" && { y: 20 }),
            };

            return (
              <motion.span
                key={`${word}-${idx}`}
                className={cn(
                  "inline-block mr-[0.25em]",
                  textClassName
                )}
                initial={initialStyle}
                aria-hidden={true}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div 
      className={cn("font-bold", className)} 
      role="text"
    >
      <div className="mt-4">
        <div className={cn(
          "text-2xl leading-snug tracking-wide",
          "transition-all duration-300 ease-in-out",
          "hover:tracking-wider"
        )}>
          {renderWords()}
        </div>
      </div>
    </div>
  );
};
