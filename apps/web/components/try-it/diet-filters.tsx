"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Leaf, Wheat, Fish, Egg, Flame, Apple } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DietFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export function DietFilters() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const dietFilters: DietFilter[] = [
    {
      id: "vegetarian",
      label: "Vegetarian",
      icon: <Leaf size={isDesktop ? 18 : 16} />
    },
    {
      id: "vegan",
      label: "Vegan",
      icon: <Apple size={isDesktop ? 18 : 16} />
    },
    {
      id: "gluten-free",
      label: "Gluten Free",
      icon: <Wheat size={isDesktop ? 18 : 16} />
    },
    {
      id: "pescatarian",
      label: "Pescatarian",
      icon: <Fish size={isDesktop ? 18 : 16} />
    },
    {
      id: "keto",
      label: "Keto",
      icon: <Egg size={isDesktop ? 18 : 16} />
    },
    {
      id: "spicy",
      label: "Spicy",
      icon: <Flame size={isDesktop ? 18 : 16} />
    }
  ];
  
  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };
  
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-3 px-3 md:mx-0 md:px-0 md:flex-wrap">
        {dietFilters.map(filter => (
          <motion.button
            key={filter.id}
            onClick={() => toggleFilter(filter.id)}
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap flex-shrink-0 ${
              activeFilters.includes(filter.id)
                ? 'bg-[#ff3b30] text-white border-[#ff3b30]'
                : 'bg-white  text-slate-700  border-slate-200  hover:border-[#ff3b30]/50'
            }`}
            whileHover={isDesktop ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
          >
            <span className={`${activeFilters.includes(filter.id) ? 'text-white' : 'text-[#ff3b30]'}`}>
              {filter.icon}
            </span>
            <span className="text-xs md:text-sm font-medium">{filter.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
} 