"use client";

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    // Add the listener to begin watching for changes
    media.addEventListener('change', listener);

    // Clean up function
    return () => media.removeEventListener('change', listener);
  }, [query]); // Only re-run effect if query changes

  return matches;
} 