"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Star, ChefHat, Search, Filter, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useConvex } from "convex/react";

interface AllFavoriteChefsProps {
  onClose: () => void;
}

interface FavoriteChef {
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

export function AllFavoriteChefs({ onClose }: AllFavoriteChefsProps) {
  const [selectedChef, setSelectedChef] = useState<FavoriteChef | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedChef) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedChef]);

  // Real data fetching for favorite chefs
  const { data: favoriteChefs = [], isLoading, error } = useQuery({
    queryKey: ['favorite-chefs'],
    queryFn: () => convex.query(api.queries.chefs.getTopRatedChefs, { limit: 6 }),
    enabled: isAuthenticated,
  });

  // Fallback to top-rated chefs if no favorites
  const { data: topChefs = [] } = useQuery({
    queryKey: ['top-chefs'],
    queryFn: () => convex.query(api.queries.chefs.getTopRatedChefs, { limit: 6 }),
    enabled: !isAuthenticated,
  });

  // Use real data or fallback
  const chefsToDisplay = favoriteChefs.length > 0 ? favoriteChefs : topChefs;

  // Transform chef data to match FavoriteChef interface
  const transformedChefs = chefsToDisplay.map((chef: any) => ({
    _id: chef._id,
    name: chef.bio?.split(' ').slice(0, 2).join(' ') || 'Chef',
    image: chef.image || undefined,
    specialties: chef.specialties || [],
    rating: chef.rating || 4.5,
    location: {
      city: chef.location?.city || 'Unknown',
      coordinates: chef.location?.coordinates || [0, 0],
    },
    experience: 'Professional',
    bio: chef.bio || 'Experienced chef with passion for great food.',
    status: chef.status || 'active',
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
            <h2 className="text-lg md:text-xl font-semibold">Your Favorite Chefs</h2>
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
        
        {/* Chef Grid - responsive layout */}
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
              <p className="text-slate-600">Failed to load chefs. Please try again.</p>
            </div>
          ) : (
            transformedChefs.map((chef: FavoriteChef) => (
              <motion.div
                key={chef._id}
              className="bg-white  rounded-xl overflow-hidden shadow-md border border-slate-200 "
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={isDesktop ? { y: -5, transition: { duration: 0.2 } } : {}}
              onClick={() => setSelectedChef(chef)}
            >
              <div className="relative h-40 md:h-48 w-full">
                <Image
                  src={chef.image || "/kitchenillus.png"}
                  alt={chef.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <div className="flex items-center bg-white/90  rounded-full px-2.5 py-1">
                    <ChefHat size={14} className="text-[#ff3b30] mr-1.5" />
                    <span className="text-sm font-medium">Chef</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 md:p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base md:text-lg font-semibold">{chef.name}</h3>
                  <div className="flex items-center bg-yellow-50  px-2 py-0.5 rounded-full">
                    <Star size={12} className="text-yellow-500 mr-1" fill="currentColor" />
                    <span className="text-sm font-medium">{chef.rating}</span>
                  </div>
                </div>
                
                <p className="text-slate-600  text-sm mb-2 md:mb-3">{chef.specialties.join(', ')}</p>
                
                <div className="flex items-center text-slate-500  mb-1.5 md:mb-2">
                  <MapPin size={12} className="mr-1" />
                  <span className="text-xs">{chef.location.city}</span>
                </div>
                
                <div className="flex items-center text-slate-500 ">
                  <Clock size={12} className="mr-1" />
                  <span className="text-xs">{chef.experience || 'Professional'} experience</span>
                </div>
                
                <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100  flex justify-between items-center">
                  <span className="text-xs bg-slate-100  px-2 py-0.5 rounded-full">
                    {chef.specialties[0] || 'Chef'}
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
      
      {/* Chef Detail Modal - mobile optimized */}
      <AnimatePresence>
        {selectedChef && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedChef(null)}
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
                  src={selectedChef.image || "/kitchenillus.png"}
                  alt={selectedChef.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: "cover" }}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{selectedChef.name}</h3>
                  <div className="flex items-center">
                    <Star size={14} className="text-yellow-400 mr-1" fill="currentColor" />
                    <span className="text-white font-medium mr-2">{selectedChef.rating}</span>
                    <span className="text-white/80">{selectedChef.specialties.join(', ')}</span>
                  </div>
                </div>
                <button 
                  className="absolute top-4 right-4 bg-black/30 rounded-full p-1.5 md:p-2 text-white active:scale-95"
                  onClick={() => setSelectedChef(null)}
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
              
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <MapPin size={14} className="text-slate-500 mr-1.5" />
                    <span className="text-slate-600  text-sm">{selectedChef.location.city}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="text-slate-500 mr-1.5" />
                    <span className="text-slate-600  text-sm">{selectedChef.experience || 'Professional'}</span>
                  </div>
                </div>
                
                <h4 className="text-base md:text-lg font-semibold mb-2">About</h4>
                <p className="text-slate-600  text-sm mb-4 md:mb-6">{selectedChef.bio}</p>
                
                <h4 className="text-base md:text-lg font-semibold mb-2">Specialties</h4>
                <div className="bg-slate-50  rounded-lg p-3 mb-4 md:mb-6 flex items-center">
                  <ChefHat size={16} className="text-[#ff3b30] mr-2" />
                  <span className="font-medium text-sm">{selectedChef.specialties.join(', ')}</span>
                </div>
                
                <div className="flex gap-3 sticky bottom-0 left-0 right-0 bg-white  pt-2">
                  <button className="flex-1 bg-[#ff3b30] text-white py-2.5 md:py-3 rounded-lg font-medium hover:bg-[#ff5e54] transition-colors active:scale-95">
                    View Menu
                  </button>
                  <button className="flex-1 border border-slate-200  py-2.5 md:py-3 rounded-lg font-medium hover:bg-slate-50  transition-colors active:scale-95">
                    Book Chef
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