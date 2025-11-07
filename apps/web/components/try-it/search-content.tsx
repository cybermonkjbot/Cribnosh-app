"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/use-session";
import { SignInScreen } from "@/components/auth/sign-in-screen";
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
  const { isAuthenticated, isLoading } = useSession();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(!!searchParams.get('q'));
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for authentication errors from OAuth callbacks
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      let errorMessage = 'Authentication failed. Please try again.';
      if (error === 'apple_signin_failed') {
        errorMessage = 'Apple Sign-In failed. Please try again.';
      } else if (error === 'apple_signin_error') {
        errorMessage = 'An error occurred during Apple Sign-In. Please try again.';
      }
      
      toast.error('Sign-In Failed', {
        description: errorMessage,
      });
      
      // Remove error from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);
  
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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#ff3b30] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in screen if not authenticated
  if (!isAuthenticated) {
    return <SignInScreen notDismissable={true} />;
  }

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