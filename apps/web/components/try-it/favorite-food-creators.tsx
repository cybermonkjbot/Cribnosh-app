"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { ChevronRight, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { AllFavoriteFoodCreators } from "./all-favorite-food-creators";

export function FavoriteFoodCreators() {
  const [showAllFoodCreators, setShowAllFoodCreators] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const favoriteFoodCreators = [
    {
      id: 1,
      name: "Food Creator Nattaya",
      image: "/kitchenillus.png",
      specialty: "Thai Cuisine",
      rating: 4.9
    },
    {
      id: 2,
      name: "Food Creator Marco",
      image: "/kitchenillus.png",
      specialty: "Italian",
      rating: 4.6
    },
    {
      id: 3,
      name: "Food Creator Tanaka",
      image: "/kitchenillus.png",
      specialty: "Japanese",
      rating: 4.9
    }
  ];

  return (
    <>
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold">Favorite FoodCreators</h3>
          <motion.button
            className="flex items-center gap-1 text-xs md:text-sm font-medium text-[#ff3b30] bg-red-50  px-2.5 md:px-3 py-1.5 rounded-full hover:bg-red-100  transition-colors active:scale-95"
            whileHover={isDesktop ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAllFoodCreators(true)}
          >
            <span>View All</span>
            <ChevronRight size={isDesktop ? 16 : 14} />
          </motion.button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {favoriteFoodCreators.map((foodCreator) => (
            <motion.div
              key={foodCreator.id}
              className="bg-white  rounded-xl overflow-hidden shadow-sm border border-slate-200 "
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={isDesktop ? { y: -5, transition: { duration: 0.2 } } : {}}
            >
              <div className="flex items-center p-2.5 md:p-3">
                <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden mr-2.5 md:mr-3">
                  <Image
                    src={foodCreator.image}
                    alt={foodCreator.name}
                    fill
                    sizes="(max-width: 768px) 40px, 48px"
                    style={{ objectFit: "cover" }}
                    loading="lazy"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-medium text-sm md:text-base truncate">{foodCreator.name}</h4>
                  <p className="text-slate-500  text-xs truncate">{foodCreator.specialty}</p>
                </div>
                <div className="flex items-center bg-yellow-50  px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                  <Star size={12} className="text-yellow-500 mr-0.5 md:mr-1" fill="currentColor" />
                  <span className="text-xs font-medium">{foodCreator.rating}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAllFoodCreators && (
          <AllFavoriteFoodCreators onClose={() => setShowAllFoodCreators(false)} />
        )}
      </AnimatePresence>
    </>
  );
} 