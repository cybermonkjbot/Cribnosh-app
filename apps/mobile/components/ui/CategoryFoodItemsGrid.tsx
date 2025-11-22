import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { CategoryFoodItemCard } from './CategoryFoodItemCard';

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

interface CategoryFoodItemsGridProps {
  title?: string;
  subtitle?: string;
  items: FoodItem[];
  onAddToCart?: (id: string) => void;
  onItemPress?: (id: string) => void;
  showShadow?: boolean;
  showSentiments?: boolean;
  showPrepTime?: boolean;
}

function CategoryFoodItemsGridComponent({
  title,
  subtitle,
  items,
  onAddToCart,
  onItemPress,
  showShadow = false,
  showSentiments = false,
  showPrepTime = false
}: CategoryFoodItemsGridProps) {
  // Memoize render item to prevent unnecessary re-renders
  const renderItem = useCallback(({ item }: { item: FoodItem }) => (
    <View style={styles.itemWrapper}>
      <CategoryFoodItemCard
        id={item.id}
        title={item.title}
        description={item.description}
        price={item.price}
        imageUrl={item.imageUrl}
        sentiment={showSentiments ? item.sentiment : undefined}
        prepTime={showPrepTime ? item.prepTime : undefined}
        isPopular={item.isPopular}
        onAddToCart={onAddToCart}
        onPress={onItemPress}
      />
    </View>
  ), [showSentiments, showPrepTime, onAddToCart, onItemPress]);

  const keyExtractor = useCallback((item: FoodItem) => item.id, []);

  // Estimate item width for getItemLayout (140px card + 16px margin)
  const ITEM_WIDTH = 156;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_WIDTH,
      offset: ITEM_WIDTH * index,
      index,
    }),
    []
  );

  // Memoize title section to prevent re-renders
  const titleSection = useMemo(() => {
    if (!title) return null;
    return (
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        )}
      </View>
    );
  }, [title, subtitle]);

  return (
    <View style={styles.container}>
      {titleSection}
      
      <View style={showShadow ? [styles.gridContainer, styles.gridContainerWithShadow] : styles.gridContainer}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          getItemLayout={getItemLayout}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={3}
          updateCellsBatchingPeriod={50}
          decelerationRate="fast"
        />
      </View>
    </View>
  );
}

// Memoize component to prevent unnecessary re-renders
export const CategoryFoodItemsGrid = React.memo(CategoryFoodItemsGridComponent);

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
    paddingRight: 16, // Add right padding for last item
  },
  itemWrapper: {
    marginRight: 16,
  },
}); 