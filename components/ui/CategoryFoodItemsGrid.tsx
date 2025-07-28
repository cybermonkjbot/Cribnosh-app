import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryFoodItemCard } from './CategoryFoodItemCard';

interface FoodItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  rating?: number;
  prepTime?: string;
  isPopular?: boolean;
}

interface CategoryFoodItemsGridProps {
  title?: string;
  subtitle?: string;
  items: FoodItem[];
  onAddToCart?: (id: string) => void;
  onItemPress?: (id: string) => void;
  showShadow?: boolean;
  showRatings?: boolean;
  showPrepTime?: boolean;
}

export function CategoryFoodItemsGrid({
  title,
  subtitle,
  items,
  onAddToCart,
  onItemPress,
  showShadow = false,
  showRatings = false,
  showPrepTime = false
}: CategoryFoodItemsGridProps) {
  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          )}
        </View>
      )}
      
      <View style={showShadow ? [styles.gridContainer, styles.gridContainerWithShadow] : styles.gridContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item, index) => (
            <View key={item.id} style={styles.itemWrapper}>
              <CategoryFoodItemCard
                id={item.id}
                title={item.title}
                description={item.description}
                price={item.price}
                imageUrl={item.imageUrl}
                rating={showRatings ? item.rating : undefined}
                prepTime={showPrepTime ? item.prepTime : undefined}
                isPopular={item.isPopular}
                onAddToCart={onAddToCart}
                onPress={onItemPress}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  titleContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#094327',
    lineHeight: 26,
    letterSpacing: -0.02,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
    letterSpacing: -0.01,
  },
  gridContainer: {
    minHeight: 240,
  },
  gridContainerWithShadow: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 16,
  },
  itemWrapper: {
    marginRight: 16,
  },
}); 