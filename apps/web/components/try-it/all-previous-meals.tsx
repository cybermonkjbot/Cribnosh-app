"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Star, ChefHat, Search, Filter } from "lucide-react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useConvex } from "convex/react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AllPreviousMealsProps {
  onClose: () => void;
}

interface PreviousMeal {
  _id: string;
  name: string;
  description: string;
  price: number;
  cuisine: string[];
  dietary: string[];
  rating?: number;
  images: string[];
  chefId: string;
  status: string;
}

export function AllPreviousMeals({ onClose }: AllPreviousMealsProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();

  // Prevent body scrolling when component is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Real data fetching for previous meals
  const { data: previousMeals = [], isLoading, error } = useQuery({
    queryKey: ['previous-meals'],
    queryFn: () => convex.query(api.queries.meals.getAll, {}),
    enabled: isAuthenticated,
  });

  // Transform meals for display with real data
  const transformedMeals = (previousMeals as any[]).map((meal: any, index: number) => {
    // Calculate real date based on creation time
    const now = Date.now();
    const mealDate = meal._creationTime || meal.createdAt || now;
    const daysDiff = Math.floor((now - mealDate) / (1000 * 60 * 60 * 24));
    
    let dateString = "Recently";
    if (daysDiff === 0) dateString = "Today";
    else if (daysDiff === 1) dateString = "Yesterday";
    else if (daysDiff < 7) dateString = `${daysDiff} days ago`;
    else if (daysDiff < 14) dateString = "Last week";
    else if (daysDiff < 30) dateString = `${Math.floor(daysDiff / 7)} weeks ago`;
    else if (daysDiff < 365) dateString = `${Math.floor(daysDiff / 30)} months ago`;
    else dateString = `${Math.floor(daysDiff / 365)} years ago`;

    return {
      ...meal,
      id: index + 1,
      title: meal.name || 'Unknown Meal',
      chef: meal.chef?.name || `Chef ${meal.chefId || 'Unknown'}`,
      image: meal.images?.[0] || "/kitchenillus.png",
      date: dateString,
      rating: meal.averageRating || meal.rating || 4.5,
      price: `$${(meal.price || 0).toFixed(2)}`,
      category: meal.cuisine?.[0] || "Chef's Special"
    };
  });

  // Group meals by month
  const groupedMeals = transformedMeals.reduce<Record<string, any[]>>((acc: Record<string, any[]>, meal: any) => {
    const month = meal.date.includes("day") ? "This Month" : "Previous Months";
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(meal);
    return acc;
  }, {});

  const filterButtons = ["All", "Thai", "Italian", "Mexican", "Japanese"];

  return (
    <motion.div
      className="fixed inset-0 bg-white  z-50 overflow-y-auto overscroll-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-section-theme="light"
    >
      {/* Main site header placeholder - adjust for mobile */}
      <div className="h-14 md:h-16"></div>
      
      {/* Fixed header - mobile optimized */}
      <div className="sticky top-0 left-0 right-0 h-14 md:h-16 bg-white/90  backdrop-blur-sm border-b border-slate-200  z-40">
        <div className="container mx-auto px-3 md:px-4 h-full flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="mr-3 md:mr-4 p-1.5 md:p-2 rounded-full hover:bg-slate-100  transition-colors active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft size={isDesktop ? 20 : 18} className="text-slate-600 " />
            </button>
            <h2 className="text-lg md:text-xl font-semibold">Previous Meals</h2>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <button className="p-1.5 md:p-2 rounded-full hover:bg-slate-100  transition-colors active:scale-95">
              <Search size={isDesktop ? 20 : 18} className="text-slate-600 " />
            </button>
            <button className="p-1.5 md:p-2 rounded-full hover:bg-slate-100  transition-colors active:scale-95">
              <Filter size={isDesktop ? 20 : 18} className="text-slate-600 " />
            </button>
          </div>
        </div>
      </div>

      {/* Content - mobile optimized */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        {isLoading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#ff3b30]/30 border-t-[#ff3b30] rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading your meal history...</p>
          </div>
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-600 mb-4">Failed to load previous meals</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : transformedMeals.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-600 mb-4">No previous meals found</p>
            <p className="text-sm text-slate-500">Start ordering to see your meal history here</p>
          </div>
        ) : (
          <>
            {/* Filter chips - horizontally scrollable on mobile */}
            <div className="mb-4 md:mb-6 bg-slate-50  rounded-xl p-3 md:p-4 border border-slate-200  overflow-x-auto hide-scrollbar">
              <div className="flex gap-2 min-w-min">
                {filterButtons.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilters(prev => 
                      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
                    )}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                      activeFilters.includes(filter)
                        ? "bg-[#ff3b30] text-white border-[#ff3b30]"
                        : "bg-white  border-slate-200 "
                    }`}
                  >
                    <span>{filter}</span>
                  </button>
                ))}
              </div>
            </div>
        
                         {/* Meal listings by month - mobile optimized */}
             {Object.entries(groupedMeals).map(([month, meals]) => (
               <div key={month} className="mb-6 md:mb-8">
                 <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 px-1">{month}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                   {meals.map((meal: any) => (
                    <motion.div
                      key={meal.id}
                      className="bg-white  rounded-xl overflow-hidden shadow-sm border border-slate-200 "
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={isDesktop ? { y: -5, transition: { duration: 0.2 } } : {}}
                    >
                      <div className="flex">
                        <div className="relative h-20 md:h-24 w-20 md:w-24 flex-shrink-0">
                          <Image
                            src={meal.image}
                            alt={meal.title}
                            fill
                            sizes="(max-width: 768px) 80px, 96px"
                            style={{ objectFit: "cover" }}
                            loading="lazy"
                          />
                        </div>
                        <div className="p-2 md:p-3 flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm md:text-base mb-0.5 md:mb-1">{meal.title}</h4>
                              <div className="flex items-center text-slate-500  mb-1">
                                <ChefHat size={12} className="mr-1" />
                                <span className="text-xs">{meal.chef}</span>
                              </div>
                            </div>
                            <span className="font-bold text-sm md:text-base text-[#ff3b30]">{meal.price}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1 md:mt-2">
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1 text-slate-500" />
                              <span className="text-xs text-slate-500">{meal.date}</span>
                            </div>
                            <div className="flex items-center">
                              <Star size={12} className="text-yellow-500 mr-0.5" fill="currentColor" />
                              <span className="text-xs font-medium">{meal.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-100  p-2 md:p-3 flex justify-between items-center">
                        <span className="text-xs bg-slate-100  px-2 py-0.5 rounded-full">
                          {meal.category}
                        </span>
                        <button className="text-xs text-[#ff3b30] font-medium active:scale-95">
                          Order Again
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
} 