"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface ParallaxSectionProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  speed?: number;
}

export function ParallaxSection({
  children,
  offset = 50,
  className = "",
  direction = "up",
  speed = 0.5,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Calculate transform based on direction
  const getTransform = () => {
    switch (direction) {
      case "up":
        return useTransform(scrollYProgress, [0, 1], [offset, -offset]);
      case "down":
        return useTransform(scrollYProgress, [0, 1], [-offset, offset]);
      case "left":
        return useTransform(scrollYProgress, [0, 1], [offset, -offset]);
      case "right":
        return useTransform(scrollYProgress, [0, 1], [-offset, offset]);
      default:
        return useTransform(scrollYProgress, [0, 1], [offset, -offset]);
    }
  };

  const transform = getTransform();
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{
          [direction === "left" || direction === "right" ? "x" : "y"]: transform,
          opacity,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Convenience wrapper for content sections
export function ParallaxContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ParallaxSection offset={20} direction="up" className={className}>
      {children}
    </ParallaxSection>
  );
}

// Wrapper for decorative elements that move in opposite directions
export function ParallaxDecoration({
  children,
  className = "",
  direction = "down",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  return (
    <ParallaxSection offset={100} direction={direction} speed={0.8} className={className}>
      {children}
    </ParallaxSection>
  );
} 