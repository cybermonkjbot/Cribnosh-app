"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface FloatingHeartsProps {
  isActive?: boolean;
  className?: string;
}

export function FloatingHearts({ isActive = false, className }: FloatingHeartsProps) {
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; targetX: number }>>([]);

  const createHeart = () => {
    if (!isActive) return;

    const newHeart = {
      id: Date.now(),
      x: Math.random() * 40 - 20, // Random x position between -20 and 20
      targetX: (Math.random() * 40 - 20)
    };

    setHearts(current => [...current, newHeart]);
    setTimeout(() => {
      setHearts(current => current.filter(heart => heart.id !== newHeart.id));
    }, 2000);
  };

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}
      onClick={createHeart}
    >
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{
              opacity: 0,
              scale: 0,
              y: 0,
              x: heart.x
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
              y: -100,
              x: heart.x + heart.targetX
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute bottom-0 left-1/2"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="#ff3b30"
              className="transform -translate-x-1/2"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
} 