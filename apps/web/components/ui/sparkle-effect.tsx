"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface SparkleEffectProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export function SparkleEffect({ children, className, color = "#ff3b30" }: SparkleEffectProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; created: number; targetX?: number; targetY?: number }>>([]);
  // Use a ref for the counter to avoid re-renders and direct state mutation
  const idCounterRef = useRef(0);

  // Memoize the sparkle SVG for performance
  const SparkleSVG = (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ color }}
    >
      <path
        d="M5 0L6.12257 3.45492H9.75528L6.81636 5.59017L7.93893 9.04508L5 6.90983L2.06107 9.04508L3.18364 5.59017L0.244718 3.45492H3.87743L5 0Z"
        fill="currentColor"
      />
    </svg>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSparkles(current => {
        // Remove sparkles older than 1 second
        const filtered = current.filter(sparkle => now - sparkle.created < 1000);
        // Add new sparkle
        const newSparkle = {
          id: idCounterRef.current++,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          created: now,
          targetX: Math.random() * 20 - 10,
          targetY: Math.random() * 20 - 10
        };
        return [...filtered, newSparkle];
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map(sparkle => (
          <motion.div
            key={sparkle.id}
            initial={{
              opacity: 0,
              scale: 0,
              x: sparkle.x,
              y: sparkle.y
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: sparkle.x + (sparkle.targetX || 0),
              y: sparkle.y + (sparkle.targetY || 0)
            }}
            transition={{ duration: 1 }}
            className="absolute left-1/2 top-1/2"
          >
            {SparkleSVG}
          </motion.div>
        ))}
      </div>
      {children}
    </div>
  );
}