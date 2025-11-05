"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Clock, Star } from "lucide-react";
import Image from "next/image";
import { AllPreviousMeals } from "./all-previous-meals";
import { useMediaQuery } from "@/hooks/use-media-query";

export function PreviousMeals() {
  const [showAllMeals, setShowAllMeals] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const previousMeals = [
    {
      id: 1,
      title: "Thai Green Curry",
      chef: "Chef Nattaya",
      image: "/kitchenillus.png",
      date: "2 days ago",
      rating: 4.9
    },
    {
      id: 2,
      title: "Vegetable Pad Thai",
      chef: "Chef Somchai",
      image: "/kitchenillus.png",
      date: "Last week",
      rating: 4.7
    },
    {
      id: 3,
      title: "Chicken Satay",
      chef: "Chef Pranee",
      image: "/kitchenillus.png",
      date: "2 weeks ago",
      rating: 4.8
    }
  ];

  return (
    <>
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold">Previous Meals</h3>
          <motion.button
            className="flex items-center gap-1 text-xs md:text-sm font-medium text-[#ff3b30] bg-red-50  px-2.5 md:px-3 py-1.5 rounded-full hover:bg-red-100  transition-colors active:scale-95"
            whileHover={isDesktop ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAllMeals(true)}
          >
            <span>View All</span>
            <ChevronRight size={isDesktop ? 16 : 14} />
          </motion.button>
        </div>
        <div className="flex overflow-x-auto pb-2 md:pb-4 gap-3 md:gap-4 hide-scrollbar -mx-3 px-3 md:mx-0 md:px-0">
          {previousMeals.map((meal) => (
            <motion.div
              key={meal.id}
              className="min-w-[180px] md:min-w-[220px] bg-white  rounded-xl overflow-hidden border border-slate-200  shadow-sm flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={isDesktop ? { y: -5, transition: { duration: 0.2 } } : {}}
            >
              <div className="relative h-24 md:h-32 w-full">
                <Image
                  src={meal.image}
                  alt={meal.title}
                  fill
                  sizes="(max-width: 768px) 180px, 220px"
                  style={{ objectFit: "cover" }}
                  loading="lazy"
                />
              </div>
              <div className="p-2.5 md:p-3">
                <h4 className="font-medium text-sm md:text-base mb-0.5 md:mb-1 line-clamp-1">{meal.title}</h4>
                <p className="text-slate-500  text-xs mb-1.5 md:mb-2 line-clamp-1">{meal.chef}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1 text-slate-500" />
                    <span className="text-xs text-slate-500">{meal.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Star size={12} className="text-yellow-500 mr-0.5 md:mr-1" fill="currentColor" />
                    <span className="text-xs font-medium">{meal.rating}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAllMeals && (
          <AllPreviousMeals onClose={() => setShowAllMeals(false)} />
        )}
      </AnimatePresence>
    </>
  );
} 