import React from 'react';
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
  // Enhanced default items with more realistic data
  const defaultItems: FoodItem[] = [
    {
      id: '1',
      title: 'Classic Chicken Burger',
      description: 'Grilled chicken breast, fresh lettuce, tomato, and special sauce',
      price: 12.99,
      sentiment: 'bussing',
      prepTime: '15-20 min',
      isPopular: true,
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
      imageUrl: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=200&h=200&fit=crop'
    },
  ];

  const displayAllAvailable = allAvailableItems.length > 0 ? allAvailableItems : defaultItems;
  const displayBestRated = bestRatedItems.length > 0 ? bestRatedItems : defaultItems.slice(0, 3);
  const displayOrderAgain = defaultItems.slice(2, 5);

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
      activeFilters={[]}
      searchPlaceholder="Search takeaway options..."
    >
      <View style={styles.content}>
        {/* Popular & Quick Section */}
        <CategoryFoodItemsGrid
          title="🔥 Popular & Quick"
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
          title="🍽️ All Available"
          subtitle="Complete menu from local kitchens"
          items={displayAllAvailable}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
          showSentiments={true}
          showPrepTime={true}
        />

        {/* Best Rated Section */}
        <CategoryFoodItemsGrid
          title="🔥 Most Loved"
          subtitle="Highest rated by our community"
          items={displayBestRated}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
          showSentiments={true}
          showPrepTime={true}
        />

        {/* Order Again Section */}
        <CategoryFoodItemsGrid
          title="🔄 Order Again"
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