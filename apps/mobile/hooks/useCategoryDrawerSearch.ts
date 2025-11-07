import { useEffect, useMemo, useState } from 'react';

interface UseCategoryDrawerSearchOptions<T> {
  items: T[];
  searchFields: (keyof T | ((item: T) => string))[];
  debounceDelay?: number;
}

interface UseCategoryDrawerSearchReturn<T> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedQuery: string;
  filteredItems: T[];
}

/**
 * Shared hook for category drawer search functionality with debouncing
 * 
 * @param options - Configuration options
 * @param options.items - Array of items to filter
 * @param options.searchFields - Fields to search in (can be keys or functions)
 * @param options.debounceDelay - Debounce delay in milliseconds (default: 300ms)
 * @returns Search state and filtered items
 */
export function useCategoryDrawerSearch<T extends Record<string, any>>({
  items,
  searchFields,
  debounceDelay = 300,
}: UseCategoryDrawerSearchOptions<T>): UseCategoryDrawerSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceDelay]);

  // Filter items based on debounced query
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    const query = debouncedQuery.toLowerCase().trim();

    return items.filter((item) => {
      return searchFields.some((field) => {
        let searchableText = '';

        if (typeof field === 'function') {
          searchableText = field(item) || '';
        } else {
          const value = item[field];
          searchableText = typeof value === 'string' ? value : String(value || '');
        }

        return searchableText.toLowerCase().includes(query);
      });
    });
  }, [items, debouncedQuery, searchFields]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    filteredItems,
  };
}

