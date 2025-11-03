import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Enhanced default items with more realistic data
  const defaultItems: FoodItem[] = useMemo(() => [
    {
      id: '1',
      title: 'Classic Chicken Burger',
      description: 'Grilled chicken breast, fresh lettuce, tomato, and special sauce',
      price: 12.99,
      sentiment: 'bussing',
      prepTime: '15-20 min',
      isPopular: true,
      isQuick: true,
      isHealthy: false,
      isSpicy: false,
      isVegan: false,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop'
    },
    {
      id: '2',
      title: 'Veggie Delight Wrap',
      description: 'Fresh vegetables, hummus, and tahini in whole wheat wrap',
      price: 9.99,
      sentiment: 'mid',
      prepTime: '10-15 min',
      isPopular: false,
      isQuick: true,
      isHealthy: true,
      isSpicy: false,
      isVegan: true,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'
    },
    {
      id: '3',
      title: 'Spicy Beef Tacos',
      description: 'Seasoned beef, salsa, guacamole, and fresh cilantro',
      price: 14.99,
      sentiment: 'bussing',
      prepTime: '20-25 min',
      isPopular: true,
      isQuick: false,
      isHealthy: false,
      isSpicy: true,
      isVegan: false,
      imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=200&h=200&fit=crop'
    },
    {
      id: '4',
      title: 'Mediterranean Salad',
      description: 'Mixed greens, olives, feta, cucumber, and balsamic dressing',
      price: 11.99,
      sentiment: 'mid',
      prepTime: '8-12 min',
      isPopular: false,
      isQuick: true,
      isHealthy: true,
      isSpicy: false,
      isVegan: false,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop'
    },
    {
      id: '5',
      title: 'Teriyaki Salmon Bowl',
      description: 'Grilled salmon, steamed rice, vegetables, and teriyaki glaze',
      price: 18.99,
      sentiment: 'bussing',
      prepTime: '25-30 min',
      isPopular: true,
      isQuick: false,
      isHealthy: true,
      isSpicy: false,
      isVegan: false,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=200&h=200&fit=crop'
    },
  ], []);

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
  const displayAllAvailable = useMemo(() => applyFilters(allAvailableBase), [allAvailableBase, applyFilters]);
  const displayBestRated = useMemo(() => {
    const base = bestRatedItems.length > 0 ? bestRatedItems : defaultItems.slice(0, 3);
    return applyFilters(base);
  }, [bestRatedItems, defaultItems, applyFilters]);
  const displayOrderAgain = useMemo(() => applyFilters(defaultItems.slice(2, 5)), [defaultItems, applyFilters]);

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
      searchPlaceholder="Search takeaway options..."
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