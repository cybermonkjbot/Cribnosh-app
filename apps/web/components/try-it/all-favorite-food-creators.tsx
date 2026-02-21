"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Star, ChefHat, Search, Filter, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";
import { useSession } from "@/lib/auth/use-session";

interface AllFavoriteFoodCreatorsProps {
  onClose: () => void;
}

interface FavoriteFoodCreator {
  _id: string;
  name: string;
  image?: string;
  specialties: string[];
  rating: number;
  location: {
    city: string;
    coordinates: [number, number];
  };
  experience?: string;
  bio: string;
  status: string;
}

export function AllFavoriteFoodCreators({ onClose }: AllFavoriteFoodCreatorsProps) {
  const [selectedFoodCreator, setSelectedFoodCreator] = useState<FavoriteFoodCreator | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const convex = useConvex();
  const { isAuthenticated } = useSession();
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedFoodCreator) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedFoodCreator]);

  // Real data fetching for favorite foodCreators
  const { data: favoriteFoodCreators = [], isLoading, error } = useQuery({
    queryKey: ['favorite-foodCreators'],
    queryFn: () => convex.query(api.queries.foodCreators.getTopRatedFoodCreators, { limit: 6 }),
    enabled: isAuthenticated,
  });

  // Fallback to top-rated foodCreators if no favorites
  const { data: topFoodCreators = [] } = useQuery({
    queryKey: ['top-foodCreators'],
    queryFn: () => convex.query(api.queries.foodCreators.getTopRatedFoodCreators, { limit: 6 }),
    enabled: !isAuthenticated,
  });

  // Use real data or fallback
  const foodCreatorsToDisplay = favoriteFoodCreators.length > 0 ? favoriteFoodCreators : topFoodCreators;

  // Transform food Creator data to match FavoriteFoodCreator interface
  const transformedFoodCreators = foodCreatorsToDisplay.map((foodCreator: any) => ({
    _id: foodCreator._id,
    name: foodCreator.bio?.split(' ').slice(0, 2).join(' ') || 'FoodCreator',
    image: foodCreator.image || undefined,
    specialties: foodCreator.specialties || [],
    rating: foodCreator.rating || 4.5,
    location: {
      city: foodCreator.location?.city || 'Unknown',
      coordinates: foodCreator.location?.coordinates || [0, 0],
    },
    experience: 'Professional',
    bio: foodCreator.bio || 'Experienced food Creator with passion for great food.',
    status: foodCreator.status || 'active',
  }));

  const filterButtons = ["All Cuisines", "Thai", "Italian", "Mexican", "Japanese"];

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
            <h2 className="text-lg md:text-xl font-semibold">Your Favorite FoodCreators</h2>
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
        
        {/* Food Creator Grid - responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {isLoading ? (
            // Loading state
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200 animate-pulse">
                <div className="h-40 md:h-48 bg-slate-200"></div>
                <div className="p-3 md:p-4">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full text-center py-8">
              <p className="text-slate-600">Failed to load foodCreators. Please try again.</p>
            </div>
          ) : (
            transformedFoodCreators.map((foodCreator: FavoriteFoodCreator) => (
              <motion.div
                key={foodCreator._id}
              className="bg-white  rounded-xl overflow-hidden shadow-md border border-slate-200 "
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={isDesktop ? { y: -5, transition: { duration: 0.2 } } : {}}
              onClick={() => setSelectedFoodCreator(foodCreator)}
            >
              <div className="relative h-40 md:h-48 w-full">
                <Image
                  src={foodCreator.image || "/kitchenillus.png"}
                  alt={foodCreator.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <div className="flex items-center bg-white/90  rounded-full px-2.5 py-1">
                    <ChefHat size={14} className="text-[#ff3b30] mr-1.5" />
                    <span className="text-sm font-medium">Food Creator</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 md:p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base md:text-lg font-semibold">{foodCreator.name}</h3>
                  <div className="flex items-center bg-yellow-50  px-2 py-0.5 rounded-full">
                    <Star size={12} className="text-yellow-500 mr-1" fill="currentColor" />
                    <span className="text-sm font-medium">{foodCreator.rating}</span>
                  </div>
                </div>
                
                <p className="text-slate-600  text-sm mb-2 md:mb-3">{foodCreator.specialties.join(', ')}</p>
                
                <div className="flex items-center text-slate-500  mb-1.5 md:mb-2">
                  <MapPin size={12} className="mr-1" />
                  <span className="text-xs">{foodCreator.location.city}</span>
                </div>
                
                <div className="flex items-center text-slate-500 ">
                  <Clock size={12} className="mr-1" />
                  <span className="text-xs">{foodCreator.experience || 'Professional'} experience</span>
                </div>
                
                <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100  flex justify-between items-center">
                  <span className="text-xs bg-slate-100  px-2 py-0.5 rounded-full">
                    {foodCreator.specialties[0] || 'FoodCreator'}
                  </span>
                  <button className="text-sm text-[#ff3b30] font-medium active:scale-95">
                    View Menu
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
        </div>
      </div>
      
      {/* Food Creator Detail Modal - mobile optimized */}
      <AnimatePresence>
        {selectedFoodCreator && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFoodCreator(null)}
          >
            <motion.div 
              className="bg-white  rounded-t-2xl md:rounded-2xl overflow-hidden w-full md:max-w-md shadow-xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-40 md:h-48 w-full">
                <Image
                  src={selectedFoodCreator.image || "/kitchenillus.png"}
                  alt={selectedFoodCreator.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: "cover" }}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{selectedFoodCreator.name}</h3>
                  <div className="flex items-center">
                    <Star size={14} className="text-yellow-400 mr-1" fill="currentColor" />
                    <span className="text-white font-medium mr-2">{selectedFoodCreator.rating}</span>
                    <span className="text-white/80">{selectedFoodCreator.specialties.join(', ')}</span>
                  </div>
                </div>
                <button 
                  className="absolute top-4 right-4 bg-black/30 rounded-full p-1.5 md:p-2 text-white active:scale-95"
                  onClick={() => setSelectedFoodCreator(null)}
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
              
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <MapPin size={14} className="text-slate-500 mr-1.5" />
                    <span className="text-slate-600  text-sm">{selectedFoodCreator.location.city}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="text-slate-500 mr-1.5" />
                    <span className="text-slate-600  text-sm">{selectedFoodCreator.experience || 'Professional'}</span>
                  </div>
                </div>
                
                <h4 className="text-base md:text-lg font-semibold mb-2">About</h4>
                <p className="text-slate-600  text-sm mb-4 md:mb-6">{selectedFoodCreator.bio}</p>
                
                <h4 className="text-base md:text-lg font-semibold mb-2">Specialties</h4>
                <div className="bg-slate-50  rounded-lg p-3 mb-4 md:mb-6 flex items-center">
                  <ChefHat size={16} className="text-[#ff3b30] mr-2" />
                  <span className="font-medium text-sm">{selectedFoodCreator.specialties.join(', ')}</span>
                </div>
                
                <div className="flex gap-3 sticky bottom-0 left-0 right-0 bg-white  pt-2">
                  <button className="flex-1 bg-[#ff3b30] text-white py-2.5 md:py-3 rounded-lg font-medium hover:bg-[#ff5e54] transition-colors active:scale-95">
                    View Menu
                  </button>
                  <button className="flex-1 border border-slate-200  py-2.5 md:py-3 rounded-lg font-medium hover:bg-slate-50  transition-colors active:scale-95">
                    Book FoodCreator
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 