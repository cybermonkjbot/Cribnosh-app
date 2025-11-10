import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { useAuthContext } from '@/contexts/AuthContext';
import { useGetTakeawayItemsQuery } from '@/store/customerApi';
import { showError } from '@/lib/GlobalToastManager';
import { CategoryFoodItemsGrid } from './CategoryFoodItemsGrid';
import { CategoryFullDrawer } from './CategoryFullDrawer';

interface FoodItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  sentiment?: 'bussing' | 'mid' | 'notIt';
  prepTime?: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  isQuick?: boolean;
  isHealthy?: boolean;
  isVegan?: boolean;
}

interface TakeawayCategoryDrawerProps {
  categoryName: string;
  onBack: () => void;
  allAvailableItems?: FoodItem[];
  bestRatedItems?: FoodItem[];
  onAddToCart?: (id: string) => void;
  onItemPress?: (id: string) => void;
}

export function TakeawayCategoryDrawer({
  categoryName,
  onBack,
  allAvailableItems = [],
  bestRatedItems = [],
  onAddToCart,
  onItemPress
}: TakeawayCategoryDrawerProps) {
  const { isAuthenticated } = useAuthContext();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Fetch takeaway items from API
  const {
    data: takeawayData,
    error: takeawayError,
  } = useGetTakeawayItemsQuery(
    { limit: 50, page: 1 },
    {
      skip: !isAuthenticated,
    }
  );

  // Transform API data to FoodItem format
  const transformTakeawayItem = useCallback((apiItem: any): FoodItem | null => {
    if (!apiItem) return null;

    // Handle different response structures
    const item = apiItem.dish || apiItem.meal || apiItem;
    
    // Extract price (API returns in cents/pence, convert to pounds/dollars)
    const priceInCents = item.price || 0;
    const price = priceInCents / 100;

    // Extract sentiment from item or default
    const sentiment = item.sentiment || 'mid';

    // Determine boolean flags from item properties
    const tags = item.tags || item.dietary_tags || [];
    const isVegan = tags.includes('vegan') || tags.includes('plant-based');
    const isSpicy = tags.includes('spicy') || tags.includes('hot');
    const isHealthy = tags.includes('healthy') || tags.includes('low-calorie');
    const isQuick = item.delivery_time ? parseInt(item.delivery_time) <= 20 : false;
    const isPopular = item.rating && item.rating >= 4.5;

    return {
      id: item._id || item.id || '',
      title: item.name || item.title || 'Unknown Item',
      description: item.description || '',
      price: price,
      sentiment: sentiment as 'bussing' | 'mid' | 'notIt',
      prepTime: item.delivery_time || item.prep_time || '20-30 min',
      isPopular: isPopular,
      isQuick: isQuick,
      isHealthy: isHealthy,
      isSpicy: isSpicy,
      isVegan: isVegan,
      imageUrl: item.image_url || item.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    };
  }, []);

  // Process takeaway items from API
  const apiTakeawayItems: FoodItem[] = useMemo(() => {
    if (!isAuthenticated || !takeawayData?.success || !takeawayData.data) {
      return [];
    }

    // SearchResponse.data is an array of SearchResult
    const items = Array.isArray(takeawayData.data) ? takeawayData.data : [];
    
    const transformedItems = items
      .map((item: any) => transformTakeawayItem(item))
      .filter((item): item is FoodItem => item !== null);
    
    return transformedItems;
  }, [takeawayData, isAuthenticated, transformTakeawayItem]);

  // Handle errors
  React.useEffect(() => {
    if (takeawayError && isAuthenticated) {
      showError('Failed to load takeaway items', 'Please try again');
    }
  }, [takeawayError, isAuthenticated]);

  // Use API data if available, otherwise use props, otherwise empty array
  const defaultItems: FoodItem[] = useMemo(() => {
    if (apiTakeawayItems.length > 0) {
      return apiTakeawayItems;
    }
    return []; // Return empty array instead of mock data
  }, [apiTakeawayItems]);

  // Filter handler
  const handleFilterChange = (filterId: string) => {
    setActiveFilters((prev: string[]) => {
      if (filterId === 'all') {
        // Toggle "all" - if it's active, clear all filters; otherwise, clear other filters and set "all"
        if (prev.includes('all')) {
          return [];
        } else {
          return ['all'];
        }
      } else {
        // Remove "all" if it exists when selecting a specific filter
        const withoutAll = prev.filter((id: string) => id !== 'all');
        
        // Toggle the selected filter
        if (withoutAll.includes(filterId)) {
          return withoutAll.filter((id: string) => id !== filterId);
        } else {
          return [...withoutAll, filterId];
        }
      }
    });
  };

  // Filter function - use useCallback to memoize
  const applyFilters = React.useCallback((items: FoodItem[]): FoodItem[] => {
    if (activeFilters.length === 0 || (activeFilters.length === 1 && activeFilters[0] === 'all')) {
      return items;
    }

    return items.filter((item: FoodItem) => {
      // If "all" is active, show everything
      if (activeFilters.includes('all')) {
        return true;
      }

      // Check each active filter
      return activeFilters.some((filterId: string) => {
        switch (filterId) {
          case 'popular':
            return item.isPopular === true;
          case 'spicy':
            return item.isSpicy === true;
          case 'quick':
            return item.isQuick === true;
          case 'healthy':
            return item.isHealthy === true;
          case 'vegan':
            return item.isVegan === true;
          default:
            return true;
        }
      });
    });
  }, [activeFilters]);

  const allAvailableBase = allAvailableItems.length > 0 ? allAvailableItems : defaultItems;
  const filteredByFilters = useMemo(() => applyFilters(allAvailableBase), [allAvailableBase, applyFilters]);
  
  // Search functionality with debouncing
  const { searchQuery, setSearchQuery, filteredItems: searchFilteredItems } = useCategoryDrawerSearch({
    items: filteredByFilters,
    searchFields: ['title', 'description'],
  });

  const displayAllAvailable = searchFilteredItems;
  // Best rated items - use props if provided, otherwise use top-rated from API data
  const displayBestRated = useMemo(() => {
    const base = bestRatedItems.length > 0 
      ? bestRatedItems 
      : defaultItems
          .filter(item => item.isPopular || (item.sentiment === 'bussing'))
          .slice(0, 3);
    const filtered = applyFilters(base);
    // Apply search to best rated if search is active
    if (searchQuery.trim()) {
      return filtered.filter((item) => {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query) || 
               item.description.toLowerCase().includes(query);
      });
    }
    return filtered;
  }, [bestRatedItems, defaultItems, applyFilters, searchQuery]);

  // Order again - use recent items from API data
  const displayOrderAgain = useMemo(() => {
    const filtered = applyFilters(defaultItems.slice(0, 3));
    // Apply search to order again if search is active
    if (searchQuery.trim()) {
      return filtered.filter((item) => {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query) || 
               item.description.toLowerCase().includes(query);
      });
    }
    return filtered;
  }, [defaultItems, applyFilters, searchQuery]);

  // Enhanced filter chips with better categorization
  const filterChips = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'vegan', label: 'Vegan', icon: 'leaf' },
    { id: 'spicy', label: 'Spicy', icon: 'flame' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'healthy', label: 'Healthy', icon: 'heart' },
    { id: 'popular', label: 'Popular', icon: 'flame' },
  ];

  return (
    <CategoryFullDrawer
      categoryName={categoryName}
      categoryDescription="Fresh, delicious takeaway options from the best local kitchens"
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onSearch={setSearchQuery}
      searchPlaceholder="Search takeaway options..."
      backButtonInSearchBar={true}
    >
      <View style={styles.content}>
        {/* Popular & Quick Section */}
        <CategoryFoodItemsGrid
          title="Popular & Quick"
          subtitle="Most ordered items, ready in 15 minutes"
          items={displayAllAvailable.filter(item => item.isPopular)}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
          showShadow={true}
          showSentiments={true}
          showPrepTime={true}
        />

        {/* All Available Section */}
        <CategoryFoodItemsGrid
          title="All Available"
          subtitle="Complete menu from local kitchens"
          items={displayAllAvailable}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
          showSentiments={true}
          showPrepTime={true}
        />

        {/* Best Rated Section */}
        <CategoryFoodItemsGrid
          title="Most Loved"
          subtitle="Highest rated by our community"
          items={displayBestRated}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
          showSentiments={true}
          showPrepTime={true}
        />

        {/* Order Again Section */}
        <CategoryFoodItemsGrid
          title="Order Again"
          subtitle="Your previous favorites"
          items={displayOrderAgain}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
          showSentiments={true}
          showPrepTime={true}
        />
      </View>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
}); 