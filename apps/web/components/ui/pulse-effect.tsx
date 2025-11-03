"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PulseEffectProps {
  color?: string;
  isActive?: boolean;
  className?: string;
}

export function PulseEffect({ color = "#ff3b30", isActive = false, className }: PulseEffectProps) {
  const [pulses, setPulses] = useState<number[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setPulses(current => {
        // Keep only the last 3 pulses
        const newPulses = [...current, Date.now()].slice(-3);
        return newPulses;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      <AnimatePresence>
        {pulses.map(id => (
          <motion.div
            key={id}
            initial={{ 
              opacity: 0.5,
              scale: 1,
            }}
            animate={{ 
              opacity: 0,
              scale: 1.5,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-2xl"
            style={{ 
              border: `2px solid ${color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
} 