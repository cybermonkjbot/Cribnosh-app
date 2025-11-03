"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TryItSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
}

export function TryItSearch({ searchQuery, setSearchQuery, isSearching }: TryItSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  // Update local input value when searchQuery prop changes
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);
  
  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer to update the search query after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 500); // 500ms debounce delay
  };

  // Clear the input
  const handleClearInput = () => {
    setInputValue("");
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <motion.div 
      className="relative w-full max-w-3xl px-3 md:px-0"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="relative flex items-center">
        <div className="absolute left-3 md:left-5 text-slate-400">
          <Search size={isDesktop ? 24 : 20} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={isDesktop ? "I'm craving spicy Thai curry with tofu..." : "What are you craving?"}
          className="w-full pl-10 md:pl-14 pr-10 md:pr-14 py-4 md:py-5 rounded-xl md:rounded-2xl bg-white  border border-slate-200  shadow-lg text-base md:text-xl focus:outline-none focus:ring-2 focus:ring-[#ff3b30]/50 transition-all"
          disabled={isSearching}
        />
        
        {inputValue && (
          <button 
            onClick={handleClearInput}
            className="absolute right-3 md:right-5 text-slate-400 hover:text-slate-600  transition-colors active:scale-95"
          >
            <X size={isDesktop ? 24 : 20} />
          </button>
        )}
      </div>
      
      <div className="absolute -bottom-4 md:-bottom-6 left-0 right-0 h-8 md:h-12 bg-gradient-to-b from-white/50 to-transparent  blur-sm z-0"></div>
      
      <motion.div 
        className="absolute -z-10 inset-0 rounded-xl md:rounded-2xl bg-gradient-to-r from-[#ff3b30]/10 to-[#ff7b72]/10 blur-xl"
        animate={{ 
          scale: [1, 1.02, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: isDesktop ? 3 : 0,
          repeat: isDesktop ? Infinity : 0,
          repeatType: "reverse"
        }}
      />
    </motion.div>
  );
} 