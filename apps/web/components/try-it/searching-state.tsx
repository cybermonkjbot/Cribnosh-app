"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";

const searchingStates = [
  "Analyzing your request",
  "Searching for perfect matches",
  "Checking available foodCreators",
  "Finding authentic recipes",
  "Considering dietary preferences",
  "Finalizing results"
];

export function SearchingState() {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStateIndex(prev => (prev + 1) % searchingStates.length);
    }, 1200);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="mt-8 md:mt-12 max-w-md px-3 md:px-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <div className="relative mr-4 md:mr-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-3 md:border-4 border-slate-200 "></div>
          <motion.div 
            className="absolute top-0 left-0 w-10 h-10 md:w-12 md:h-12 rounded-full border-3 md:border-4 border-transparent border-t-[#ff3b30]"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
        
        <div className="flex flex-col flex-1 min-w-0">
          <div className="h-6 md:h-8 flex items-center">
            <motion.p
              key={currentStateIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm md:text-base text-slate-600  font-medium truncate"
            >
              {searchingStates[currentStateIndex]}
            </motion.p>
          </div>
          
          <div className="mt-1.5 md:mt-2 flex space-x-1.5 md:space-x-2">
            {searchingStates.map((_, index) => (
              <motion.div
                key={index}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${index === currentStateIndex ? 'bg-[#ff3b30]' : 'bg-slate-300 '}`}
                animate={index === currentStateIndex ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.6, repeat: index === currentStateIndex ? Infinity : 0 }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 