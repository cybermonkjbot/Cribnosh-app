import { motion } from "motion/react";
import React from "react";

interface FooterColumnProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

export function FooterColumn({ title, children, delay = 0 }: FooterColumnProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        delay: delay * 0.1,
        ease: "easeOut" 
      }}
      className="flex flex-col space-y-4"
    >
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="flex flex-col space-y-3">
        {children}
      </div>
    </motion.div>
  );
} 