"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSession } from "@/lib/auth/use-session";
import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { motion } from "motion/react";
import { useRef } from "react";

interface SearchSuggestionsProps {
  query: string;
  onSelectSuggestion: (suggestion: string) => void;
}

export function SearchSuggestions({ query, onSelectSuggestion }: SearchSuggestionsProps) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const convex = useConvex();
  const { user } = useSession();
  const userId = user?._id as Id<'users'> | undefined;
  
  // Real data fetching for search suggestions with user preferences
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['search-suggestions', query, userId],
    queryFn: () => convex.query((api as any).queries.meals.getSearchSuggestions, { query, userId }),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!query) return null;
  
  return (
    <motion.div
      className="mt-4 md:mt-6 text-left w-full max-w-3xl px-3 md:px-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white  rounded-xl shadow-lg border border-slate-200  overflow-hidden">
        <div className="p-1.5 md:p-2">
          <div className="text-xs md:text-sm font-medium text-slate-500  px-2.5 md:px-3 py-2 flex items-center">
            {isLoading ? (
              <>
                <motion.span 
                  className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#ff3b30] mr-2 inline-block"
                  animate={{ scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span>Thinking...</span>
              </>
            ) : (
              <span>Suggestions</span>
            )}
          </div>
          
                     {!isLoading && suggestions && suggestions.length > 0 && (
             <ul className="space-y-0.5 md:space-y-1">
               {suggestions.map((suggestion: string, index: number) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <button
                    onClick={() => onSelectSuggestion(suggestion)}
                    className="w-full text-left px-3 md:px-4 py-2.5 md:py-3 hover:bg-slate-100  active:bg-slate-200  transition-colors rounded-lg flex items-center text-sm md:text-base"
                  >
                    <span className="text-[#ff3b30] mr-1.5 md:mr-2 text-base md:text-lg">→</span>
                    <span className="line-clamp-2 md:line-clamp-1">{suggestion}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
} 