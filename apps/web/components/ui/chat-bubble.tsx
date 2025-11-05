"use client";

import { motion } from "motion/react";
import { Zap } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  className?: string;
}

export function ChatBubble({ message, className = "" }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative max-w-md ${className}`}
    >
      {/* AI Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] flex items-center justify-center text-white shadow-lg z-10"
      >
        <Zap size={16} />
      </motion.div>
      
      {/* Message Bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {/* Bubble Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] rounded-2xl opacity-10" />
        
        {/* Bubble Content */}
        <div className="relative bg-white  p-4 rounded-2xl shadow-sm border border-[#ff3b30]/20">
          {/* Tail */}
          <div className="absolute -left-2 top-4 w-4 h-4 bg-white  border-l border-t border-[#ff3b30]/20 transform rotate-45" />
          
          {/* Message Text */}
          <p className="text-gray-900  font-['Satoshi'] leading-relaxed pl-2">
            {message}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
} 