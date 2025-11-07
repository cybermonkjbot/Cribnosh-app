"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { 
  TryItSearch, 
  SearchResults, 
  SearchSuggestions, 
  SearchingState,
  DietFilters,
  PreviousMeals,
  FavoriteChefs,
  AppDownloadCTA,
} from "@/components/try-it";

export default function SearchContent() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(!!searchParams.get('q'));
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle URL search query on mount and when it changes
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    }
  }, [searchParams]);
  
  // Set data-section-theme on mount
  useEffect(() => {
    // Force the header to use light theme
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.setAttribute('data-section-theme', 'light');
    }
    
    // Reset body overflow to ensure proper scrolling
    document.body.style.overflow = '';
  }, []);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Clear any existing search timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    
    if (query.length > 0) {
      // Only start searching if the query is at least 3 characters
      if (query.length >= 3) {
        setIsSearching(true);
        
        // Set a timer for the search to complete
        searchTimerRef.current = setTimeout(() => {
          setIsSearching(false);
          setShowResults(true);
        }, 1500);
      }
    } else {
      setIsSearching(false);
      setShowResults(false);
    }
  };
  
  const handleClearSearch = () => {
    // Clear any existing search timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    
    setSearchQuery("");
    setIsSearching(false);
    setShowResults(false);
    
    // Remove the query parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  };

  if (showResults) {
    return <SearchResults query={searchQuery} onClearSearch={handleClearSearch} />;
  }

  return (
    <section 
      data-section-theme="light" 
      className="min-h-[calc(100vh-4rem)] pt-32 pb-24"
    >
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl text-left"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#ff3b30] to-[#ff7b72]  ">
            What do you want to eat today?
          </h1>
          <p className="text-lg md:text-xl text-slate-600  mb-12">
            Tell me exactly what you want, and I'll find the perfect meal for you
          </p>
          
          <TryItSearch 
            searchQuery={searchQuery} 
            setSearchQuery={handleSearch} 
            isSearching={isSearching}
          />
          
          {/* Diet Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4"
          >
            <DietFilters />
          </motion.div>
          
          {isSearching && <SearchingState />}
          
          {!isSearching && searchQuery && searchQuery.length >= 2 && (
            <SearchSuggestions query={searchQuery} onSelectSuggestion={handleSearch} />
          )}
          
          {/* Previous Meals and Favorite Chefs */}
          {!isSearching && !searchQuery && (
            <>
              <div className="mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <PreviousMeals />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <FavoriteChefs />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="mt-8">
                    <AppDownloadCTA />
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
} 