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
  // Default items for demonstration
  const defaultItems: FoodItem[] = [
    {
      id: '1',
      title: 'Chicken burger',
      description: '100 gr chicken + tomato + cheese Lettuce',
      price: 20.00,
      imageUrl: undefined,
    },
    {
      id: '2',
      title: 'Chicken burger',
      description: '100 gr chicken + tomato + cheese Lettuce',
      price: 20.00,
      imageUrl: undefined,
    },
    {
      id: '3',
      title: 'Chicken burger',
      description: '100 gr chicken + tomato + cheese Lettuce',
      price: 20.00,
      imageUrl: undefined,
    },
  ];

  const displayAllAvailable = allAvailableItems.length > 0 ? allAvailableItems : defaultItems;
  const displayBestRated = bestRatedItems.length > 0 ? bestRatedItems : defaultItems;

  // Default filter chips
  const filterChips = [
    { id: 'vegan', label: 'Vegan', icon: 'leaf' },
    { id: 'spicy', label: 'Spicy', icon: 'flame' },
    { id: 'keto', label: 'Keto', icon: 'egg' },
    { id: 'gluten-free', label: 'Gluten Free', icon: 'nutrition' },
  ];

  return (
    <CategoryFullDrawer
      categoryName={categoryName}
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={[]}
    >
      <View style={styles.content}>
        {/* All Available Section */}
        <CategoryFoodItemsGrid
          title="All Available"
          items={displayAllAvailable}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
          showShadow={true}
        />

        {/* Best Rated Section */}
        <CategoryFoodItemsGrid
          title="Best Rated Takeaway's"
          items={displayBestRated}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
        />

        {/* Order Again Section */}
        <CategoryFoodItemsGrid
          title="Order Again"
          items={displayAllAvailable}
          onAddToCart={onAddToCart}
          onItemPress={onItemPress}
        />
      </View>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
}); 