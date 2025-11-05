import { motion } from "motion/react";
import Link from "next/link";
import React from "react";
import { DarkLightImage } from "../dark-light-image";
import { cn } from "../../lib/utils";

interface FooterLogoProps {
  dark?: string;
  light?: string;
  href?: string;
  className?: string;
  cursorText?: string;
}

export function FooterLogo({ 
  dark = "/logo.svg", 
  light = "/logo.svg", 
  href = "/",
  className,
  cursorText = "Back to Home"
}: FooterLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("flex items-center", className)}
    >
      <Link href={href} className="block" data-cursor-text={cursorText}>
        <div className="h-8 w-auto">
          <DarkLightImage 
            dark={{ 
              src: dark,
              alt: "Logo",
              width: 160,
              height: 32
            }} 
            light={{ 
              src: light,
              alt: "Logo",
              width: 160,
              height: 32
            }} 
            priority
          />
        </div>
      </Link>
    </motion.div>
  );
} 