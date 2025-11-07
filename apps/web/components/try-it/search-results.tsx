"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/lib/auth/use-session";
import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { ArrowLeft, Check, ChefHat, Clock, MapPin, Plus, Shuffle, Star, ShoppingCart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AiDecisionProcess } from "./ai-decision-process";
import { FloatingAssistantInput } from "./floating-assistant-input";
import { useAddToCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Utility functions for distance and time calculations
function calculateDistance(userLocation: any, mealLocation: any): string {
  if (!userLocation || !mealLocation) {
    return "Distance unavailable";
  }

  // Haversine formula to calculate distance between two coordinates
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(mealLocation.latitude - userLocation.latitude);
  const dLon = toRadians(mealLocation.longitude - userLocation.longitude);
  const lat1 = toRadians(userLocation.latitude);
  const lat2 = toRadians(mealLocation.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return `${distance.toFixed(1)} miles`;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculatePrepTime(meal: any): string {
  // Base prep time based on meal complexity
  let baseTime = 30; // Default 30 minutes
  
  // Adjust based on meal characteristics
  if (meal.cuisine && meal.cuisine.includes('Italian')) {
    baseTime = 25; // Pasta dishes are typically faster
  } else if (meal.cuisine && meal.cuisine.includes('Asian')) {
    baseTime = 35; // Stir-fries and Asian dishes
  } else if (meal.cuisine && meal.cuisine.includes('Indian')) {
    baseTime = 40; // Curries take longer
  } else if (meal.cuisine && meal.cuisine.includes('Mexican')) {
    baseTime = 30; // Tacos and burritos
  }

  // Add variation for freshness and complexity
  const variation = Math.floor(Math.random() * 10) - 5; // ±5 minutes
  const finalTime = Math.max(15, baseTime + variation); // Minimum 15 minutes
  
  return `${finalTime}-${finalTime + 10} min`;
}

interface SearchResultsProps {
  query: string;
  onClearSearch: () => void;
}

interface MealResult {
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

export function SearchResults({ query, onClearSearch }: SearchResultsProps) {
  const [isDeciding, setIsDeciding] = useState(false);
  const [decisionStage, setDecisionStage] = useState(0);
  const [decidedResult, setDecidedResult] = useState<number | null>(null);
  const [selectedSubItems, setSelectedSubItems] = useState<string[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const convex = useConvex();
  const { user, isAuthenticated } = useSession();
  const userId = user?._id as Id<'users'> | undefined;
  const router = useRouter();
  const addToCart = useAddToCart();
  
  // Set data-section-theme on mount and clean up on unmount
  useEffect(() => {
    // Store the original data-section-theme if any
    const mainElement = document.querySelector('main');
    const originalTheme = mainElement?.getAttribute('data-section-theme') || '';
    
    // Set the theme to light for the header
    if (mainElement) {
      mainElement.setAttribute('data-section-theme', 'light');
    }
    
    // Clean up on unmount
    return () => {
      if (mainElement) {
        if (originalTheme) {
          mainElement.setAttribute('data-section-theme', originalTheme);
        } else {
          mainElement.removeAttribute('data-section-theme');
        }
      }
    };
  }, []);

  // Show assistant after a short delay when decision is made
  useEffect(() => {
    // decidedResult changed
    if (decidedResult !== null) {
      // Setting timer to show assistant
      const timer = setTimeout(() => {
        // Timer expired, showing assistant
        setShowAssistant(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [decidedResult]);

  // Add effect to log assistant visibility changes
  useEffect(() => {
    // Assistant visibility changed
  }, [showAssistant]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or failed:', error);
          // Fallback to default location (San Francisco)
          setUserLocation({
            latitude: 37.7749,
            longitude: -122.4194
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      // Fallback to default location
      setUserLocation({
        latitude: 37.7749,
        longitude: -122.4194
      });
    }
  }, []);

  // Real data fetching for search results with user preferences
  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ['search-meals', query, userId],
    queryFn: () => convex.query((api as any).queries.meals.searchMeals, { 
      query: query,
      userId,
      filters: {
        cuisine: undefined,
        priceRange: undefined,
        dietary: undefined
      }
    }),
    enabled: !!query && query.length > 0,
  });

  // Fetch personalized recommendations when user is authenticated
  const { data: recommendationsData, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ['recommended-meals', userId],
    queryFn: async () => {
      if (!userId) return { recommendations: [] };
      
      try {
        const response = await fetch('/api/customer/meals/recommended?limit=6', {
          credentials: 'include',
        });
        if (!response.ok) {
          return { recommendations: [] };
        }
        const data = await response.json();
        return data.success ? data.data : { recommendations: [] };
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return { recommendations: [] };
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const recommendations = recommendationsData?.recommendations || [];

  // Transform results to match component expectations
  const results = searchResults.map((meal: any, index: number) => ({
    id: index + 1,
    title: meal.name,
    chef: meal.chef?.name || `Chef ${meal.chefId}`,
    image: meal.images[0] || "/kitchenillus.png",
    rating: meal.averageRating || meal.rating || 4.5,
    reviews: meal.reviewCount || 0,
    distance: calculateDistance(userLocation, meal.location),
    time: calculatePrepTime(meal),
    price: `$${meal.price.toFixed(2)}`,
    tags: [...(meal.cuisine || []), ...(meal.dietary || [])].slice(0, 3)
  }));

  // Decision process stages
  const decisionStages = [
    "Analyzing your preferences...",
    "Checking meal options...",
    "Considering dietary factors...",
    "Evaluating chef availability...",
    "Finalizing selection..."
  ];

  // Get real suggested sub-items from the selected meal
  const suggestedSubItems = decidedResult !== null && searchResults[decidedResult] 
    ? (searchResults[decidedResult] as any)['suggestedItems'] || []
    : [];

  // AI reasoning points for the decision
  const aiReasoningPoints = [
    "Based on your past orders of spicy dishes",
    "Chef Nattaya has a 98% satisfaction rating",
    "Ingredients sourced from local organic farms",
    "Matches your preference for authentic flavors",
    "Nutritionally balanced with protein and vegetables"
  ];

  // Handle the "Decide for me" button click
  const handleDecideForMe = () => {
    setIsDeciding(true);
    setDecisionStage(0);
    setDecidedResult(null);
    
    // Simulate the decision process with stages
    const stageInterval = setInterval(() => {
      setDecisionStage(prev => {
        // If we've reached the last stage, clear the interval and set the result
        if (prev >= decisionStages.length - 1) {
          clearInterval(stageInterval);
          
          // Pick a random result
          setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * results.length);
            setDecidedResult(randomIndex);
            setIsDeciding(false);
          }, 800);
          
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  // Handle adding or removing sub-items
  const toggleSubItem = (itemName: string) => {
    setSelectedSubItems(prev => 
      prev.includes(itemName)
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  // Handle assistant messages
  const handleAssistantMessage = (message: string) => {
    // Here you would typically handle the message with your AI logic
    // Assistant message received
    // Don't hide the assistant after sending a message
    // Let the user explicitly close it using the close button
  };

  // Handle adding item to cart
  const handleAddToCart = async (mealId: string, mealName: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      router.push('/try-it');
      return;
    }

    setAddingToCart(mealId);
    try {
      await addToCart.mutateAsync({
        dishId: mealId,
        quantity: 1,
      });
      toast.success(`Added ${mealName} to cart`);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      const errorMessage = error?.message || 'Failed to add item to cart. Please try again.';
      toast.error(errorMessage);
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col bg-white "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      data-section-theme="light"
    >
      {/* Main site header placeholder - 64px height */}
      <div className="h-16"></div>
      
      {/* Fixed header that attaches below the main header */}
      <div className="sticky top-16 left-0 right-0 h-16 bg-white/90  backdrop-blur-sm border-b border-slate-200  z-40">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onClearSearch}
              className="mr-4 p-2 rounded-full hover:bg-slate-100  transition-colors"
              aria-label="Back to search"
            >
              <ArrowLeft size={20} className="text-slate-600 " />
            </button>
            <div className="flex flex-col">
              <span className="text-sm text-slate-500  font-medium">Results for</span>
              <h2 className="text-lg font-semibold text-[#ff3b30]">{query}</h2>
            </div>
          </div>
          
          <button
            onClick={handleDecideForMe}
            disabled={isDeciding || decidedResult !== null}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
              isDeciding || decidedResult !== null 
                ? 'bg-slate-200  text-slate-500  cursor-not-allowed' 
                : 'bg-[#ff3b30] text-white hover:bg-[#ff5e54]'
            }`}
          >
            {isDeciding ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <Shuffle size={16} />
                </motion.div>
                <span>Deciding...</span>
              </>
            ) : decidedResult !== null ? (
              <>
                <Check size={16} />
                <span>Decided!</span>
              </>
            ) : (
              <>
                <Shuffle size={16} />
                <span>Decide for me</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Decision process overlay */}
        <AnimatePresence>
          {isDeciding && (
            <motion.div
              className="fixed inset-0 bg-white/90  backdrop-blur-md z-50 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full border-4 border-[#ff3b30]/30 border-t-[#ff3b30] animate-spin"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <motion.p
                className="mt-8 text-xl font-medium"
                key={decisionStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {decisionStages[decisionStage]}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            // Loading state
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#ff3b30]/30 border-t-[#ff3b30] rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600">Searching for delicious meals...</p>
            </div>
          ) : error ? (
            // Error state
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-slate-600 mb-4">Failed to load search results</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-[#ff3b30] text-white rounded-lg hover:bg-[#ff5e54] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : decidedResult !== null ? (
            <div className="mb-12">
              <div className="mb-8 flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-10 h-10 rounded-full bg-[#ff3b30] flex items-center justify-center mr-4"
                >
                  <Check size={24} className="text-white" />
                </motion.div>
                <h3 className="text-2xl font-display font-bold">We've decided for you!</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                {/* Left side - The decided meal */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="lg:col-span-3 bg-white/80  backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 "
                >
                  <div className="relative h-64 sm:h-72 md:h-80 w-full">
                    <Image
                      src={results[decidedResult].image}
                      alt={results[decidedResult].title}
                      fill
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center mb-2"
                      >
                        <ChefHat size={18} className="text-white mr-2" />
                        <span className="text-white font-medium">{results[decidedResult].chef}</span>
                      </motion.div>
                      <motion.h4 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-display font-bold text-white mb-2"
                      >
                        {results[decidedResult].title}
                      </motion.h4>
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center"
                      >
                        <Star size={18} className="text-yellow-400 mr-1" fill="currentColor" />
                        <span className="text-white font-medium mr-1">{results[decidedResult].rating}</span>
                        <span className="text-white/80">({results[decidedResult].reviews} reviews)</span>
                      </motion.div>
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-slate-500 mr-2" />
                        <span className="text-slate-700 ">{results[decidedResult].distance}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="text-slate-500 mr-2" />
                        <span className="text-slate-700 ">{results[decidedResult].time}</span>
                      </div>
                      <span className="text-2xl font-display font-bold text-[#ff3b30]">{results[decidedResult].price}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {results[decidedResult].tags.map((tag: any, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1.5 bg-slate-100/80  backdrop-blur-sm rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {selectedSubItems.length > 0 && (
                      <div className="mb-6 border-t border-slate-200  pt-4">
                        <h5 className="font-display text-base font-semibold mb-3">Added to your feast:</h5>
                        <div className="space-y-2">
                          {selectedSubItems.map((item) => {
                            const subItem = suggestedSubItems.find((si: any) => si.name === item);
                            return (
                              <motion.div 
                                key={item} 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between px-3 py-2 bg-slate-50/80  backdrop-blur-sm rounded-lg"
                              >
                                <span className="font-medium">{item}</span>
                                <span className="text-[#ff3b30] font-medium">{subItem?.price}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 ">
                          <span className="font-medium">Total additions:</span>
                          <span className="text-[#ff3b30] font-medium">
                            ${selectedSubItems
                              .reduce((total, item) => {
                                const subItem = suggestedSubItems.find((si: any) => si.name === item);
                                return total + (subItem ? parseFloat(subItem.price.substring(1)) : 0);
                              }, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <button 
                      className="w-full py-3.5 bg-linear-to-r from-[#ff3b30] to-[#ff5e54] text-white rounded-lg font-medium hover:from-[#ff2a1f] hover:to-[#ff4a40] transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      aria-label="Order this meal now"
                    >
                      <span>Order Now</span>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowLeft size={16} className="transform rotate-180" />
                      </motion.div>
                    </button>
                  </div>
                </motion.div>

                {/* Right side - AI decision process and sub-items */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="lg:col-span-2 flex flex-col gap-6"
                >
                  {/* AI Decision Process */}
                  <AiDecisionProcess reasoningPoints={aiReasoningPoints} />
                  
                  {/* Suggested Sub-items */}
                  <div className="bg-white/70  backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-slate-200/50  p-5 md:p-6">
                    <h4 className="text-lg font-display font-semibold mb-3">Perfect Complements</h4>
                    <p className="text-sm text-slate-600  mb-5">
                      Elevate your culinary journey with these thoughtfully paired additions
                    </p>
                    
                    <div className="space-y-3">
                      {suggestedSubItems.map((item: any) => (
                        <motion.button
                          key={item.id}
                          className={`w-full p-3 border rounded-xl cursor-pointer transition-all duration-300 ${
                            selectedSubItems.includes(item.name)
                              ? 'border-[#ff3b30] bg-[#ff3b30]/5 shadow-md'
                              : 'border-slate-200  hover:border-[#ff3b30]/50 hover:shadow-sm'
                          }`}
                          onClick={() => toggleSubItem(item.name)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          aria-pressed={selectedSubItems.includes(item.name)}
                          aria-label={`Add ${item.name} to your order - ${item.price}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-left">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 transition-colors ${
                                selectedSubItems.includes(item.name)
                                  ? 'bg-[#ff3b30]'
                                  : 'bg-slate-100 '
                              }`}>
                                {selectedSubItems.includes(item.name) ? (
                                  <Check size={14} className="text-white" />
                                ) : (
                                  <Plus size={14} className="text-slate-500 " />
                                )}
                              </div>
                              <div>
                                <h5 className="font-medium">{item.name}</h5>
                                <p className="text-xs text-slate-500  mt-0.5 line-clamp-1">{item.description}</p>
                              </div>
                            </div>
                            <span className="font-display font-semibold text-[#ff3b30] ml-2">{item.price}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    
                    {selectedSubItems.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200  flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600 ">
                          {selectedSubItems.length} {selectedSubItems.length === 1 ? 'item' : 'items'} selected
                        </span>
                        <button 
                          onClick={() => setSelectedSubItems([])}
                          className="text-xs font-medium text-[#ff3b30] hover:text-[#ff5e54] transition-colors"
                          aria-label="Clear all selected items"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="text-2xl font-display font-bold mb-6">Top Matches</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((result: any, index: number) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white/80  backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 "
                    >
                      <div className="relative h-48">
                        <Image
                          src={result.image}
                          alt={result.title}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-700 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center mb-2">
                            <ChefHat size={16} className="text-white mr-2" />
                            <span className="text-white font-medium">{result.chef}</span>
                          </div>
                          <h4 className="text-xl font-display font-bold text-white mb-2">{result.title}</h4>
                          <div className="flex items-center">
                            <Star size={16} className="text-yellow-400 mr-1" fill="currentColor" />
                            <span className="text-white font-medium mr-1">{result.rating}</span>
                            <span className="text-white/80">({result.reviews} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <MapPin size={14} className="text-slate-500 mr-1" />
                            <span className="text-sm text-slate-700 ">{result.distance}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={14} className="text-slate-500 mr-1" />
                            <span className="text-sm text-slate-700 ">{result.time}</span>
                          </div>
                          <span className="text-xl font-display font-bold text-[#ff3b30]">{result.price}</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {result.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-2.5 py-1 bg-slate-100/80  backdrop-blur-sm rounded-full text-sm font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            const meal = searchResults.find((m: any, idx: number) => idx === index);
                            if (meal) {
                              handleAddToCart(meal._id, meal.name || result.title);
                            }
                          }}
                          disabled={addingToCart !== null}
                          className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white"
                        >
                          {addingToCart === searchResults[index]?._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-display font-bold mb-8">Recommended For You</h3>
                {isLoadingRecommendations && userId ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {recommendations.map((meal: any, index: number) => (
                      <motion.div
                        key={meal._id || meal.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="relative group cursor-pointer"
                        onClick={() => {
                          // Navigate to meal details or handle click
                          console.log('Meal clicked:', meal);
                        }}
                      >
                        <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                          <Image
                            src={meal.images?.[0] || meal.image_url || "/kitchenillus.png"}
                            alt={meal.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white text-sm font-medium">
                              {(meal.averageRating || meal.rating || 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold mb-2 line-clamp-1">{meal.name}</h4>
                          <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                            {meal.description || meal.chef?.name || `Chef ${meal.chefId}`}
                          </p>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xl font-bold text-[#ff3b30]">
                              £{(meal.price || 0).toFixed(2)}
                            </span>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              {meal.chef?.name && (
                                <div className="flex items-center gap-1">
                                  <ChefHat className="w-4 h-4" />
                                  <span>{meal.chef.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(meal._id, meal.name)}
                            disabled={addingToCart === meal._id}
                            className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white"
                          >
                            {addingToCart === meal._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Adding...
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : userId ? (
                  <div className="col-span-1 md:col-span-3 p-8 bg-linear-to-r from-[#ff3b30]/10 to-[#ff7b72]/10 rounded-xl border border-[#ff3b30]/20 shadow-sm">
                    <h4 className="text-xl font-semibold mb-3">No recommendations yet</h4>
                    <p className="text-slate-600 mb-6">
                      Start liking meals and following chefs to get personalized recommendations!
                    </p>
                  </div>
                ) : (
                  <div className="col-span-1 md:col-span-3 p-8 bg-linear-to-r from-[#ff3b30]/10 to-[#ff7b72]/10 rounded-xl border border-[#ff3b30]/20 shadow-sm">
                    <h4 className="text-xl font-semibold mb-3">Looking for something specific?</h4>
                    <p className="text-slate-600 mb-6">
                      Sign in to get personalized meal recommendations based on your preferences and dietary needs.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating assistant */}
      <AnimatePresence>
        {showAssistant && (
          <FloatingAssistantInput
            isVisible={showAssistant}
            onSendMessage={handleAssistantMessage}
            onClose={() => setShowAssistant(false)}
            placeholder="Ask me about modifying this meal or suggest alternatives..."
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
} 