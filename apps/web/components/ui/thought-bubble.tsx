import { motion } from "motion/react";
import { useState } from "react";
import { SparkleEffect } from "./sparkle-effect";
import { FloatingHearts } from "./floating-hearts";
import { PulseEffect } from "./pulse-effect";

interface ThoughtBubbleProps {
  onClick?: () => void;
  className?: string;
}

export function ThoughtBubble({ onClick, className = "" }: ThoughtBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000);
    onClick?.();
  };

  return (
    <motion.button
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Interactive effects */}
      <SparkleEffect color={isHovered ? "#ff5e54" : "#ff3b30"}>
        <span className="sr-only">Sparkle effect</span>
      </SparkleEffect>
      <FloatingHearts isActive={isClicked} />
      <PulseEffect isActive={isHovered} />

      {/* Main bubble */}
      <motion.div 
        className="relative bg-[#ff3b30] hover:bg-[#ff5e54] text-white px-6 py-3 rounded-2xl font-['Satoshi'] font-medium shadow-lg transition-colors"
        initial={{ y: 0 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Share Your Story
        
        {/* Small decorative bubbles */}
        <div className="absolute -bottom-3 -right-2 w-3 h-3 bg-[#ff3b30] group-hover:bg-[#ff5e54] rounded-full transition-colors" />
        <div className="absolute -bottom-6 -right-4 w-2 h-2 bg-[#ff3b30] group-hover:bg-[#ff5e54] rounded-full transition-colors" />
      </motion.div>

      {/* Hover effect - ripple */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-white"
        initial={{ opacity: 0, scale: 1 }}
        whileHover={{ opacity: 0.2, scale: 1.2 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
} 