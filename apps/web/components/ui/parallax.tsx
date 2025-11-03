"use client";

import {
  useScroll,
  useTransform,
  motion,
  type MotionValue
} from "motion/react";
import { useRef } from "react";
import { useMobileDevice } from "@/hooks/use-mobile-device";

interface ParallaxProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export const Parallax = ({ children, offset = 50, className }: ParallaxProps) => {
  const ref = useRef(null);
  const isMobile = useMobileDevice();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${offset}%`]);

  return (
    <div ref={ref} className={className}>
      {isMobile ? (
        <div>{children}</div>
      ) : (
        <motion.div style={{ y }}>{children}</motion.div>
      )}
    </div>
  );
};

export const ParallaxGroup = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef(null);

  return (
    <div ref={ref} className="relative w-full">
      {children}
    </div>
  );
};

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  asBackground?: boolean;
}

export const ParallaxLayer = ({ 
  children, 
  speed = 1, 
  className = "",
  asBackground = false 
}: ParallaxLayerProps) => {
  const ref = useRef(null);
  const isMobile = useMobileDevice();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `${speed * 10}%`]
  );

  return (
    <div
      ref={ref}
      className={`${asBackground ? 'fixed' : 'absolute'} w-full ${className}`}
    >
      {isMobile ? (
        <div>{children}</div>
      ) : (
        <motion.div style={{ y: asBackground ? 0 : y }}>{children}</motion.div>
      )}
    </div>
  );
}; 