import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryFoodItemCard } from './CategoryFoodItemCard';

interface FoodItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface CategoryFoodItemsGridProps {
  title?: string;
  items: FoodItem[];
  onAddToCart?: (id: string) => void;
  onItemPress?: (id: string) => void;
  showShadow?: boolean;
}

export function CategoryFoodItemsGrid({
  title,
  items,
  onAddToCart,
  onItemPress,
  showShadow = false
}: CategoryFoodItemsGridProps) {
  return (
    <View style={styles.container}>
      {title && (
        <Text style={styles.sectionTitle}>{title}</Text>
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#094327',
    lineHeight: 22,
    letterSpacing: 0.03,
    marginBottom: 14,
  },
  gridContainer: {
    minHeight: 233,
  },
  gridContainerWithShadow: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 55,
    elevation: 8,
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 20,
  },
  itemWrapper: {
    marginRight: 20,
  },
}); 