import { motion } from "motion/react";
import React from "react";

interface FooterCopyrightProps {
  text?: string;
}

export function FooterCopyright({
  text = `© ${new Date().getFullYear()} Cribland. All rights reserved.`,
}: FooterCopyrightProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full border-t border-border/30 pt-6 mt-6">
      <motion.p
        className="text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {text}
      </motion.p>
    </div>
  );
} 