import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../MealItemDetails/Skeletons/ShimmerBox';

/**
 * Skeleton loader for category items
 */
export const CategoriesSkeleton: React.FC = () => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.categoryItem}>
          <SkeletonBox width={75} height={75} borderRadius={20} style={styles.categoryIcon} />
          <SkeletonBox width={60} height={16} borderRadius={4} style={styles.categoryName} />
        </View>
      ))}
    </ScrollView>
  );
};

/**
 * Skeleton loader for meal cards
 */
export const MealsSkeleton: React.FC = () => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.mealsContainer}
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.mealCard}>
          <SkeletonBox width={150} height={120} borderRadius={10} style={styles.mealImage} />
          <View style={styles.mealInfo}>
            <SkeletonBox width={120} height={16} borderRadius={4} style={styles.mealName} />
            <SkeletonBox width={60} height={18} borderRadius={4} style={styles.mealPrice} />
            <SkeletonBox width={50} height={14} borderRadius={4} style={styles.deliveryTime} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  categoriesContainer: {
    paddingRight: 10,
  },
  categoryItem: {
    width: 75,
    height: 102,
    marginRight: 15,
    alignItems: 'center',
  },
  categoryIcon: {
    marginBottom: 5,
  },
  categoryName: {
    alignSelf: 'center',
  },
  mealsContainer: {
    paddingRight: 10,
  },
  mealCard: {
    width: 150,
    height: 200,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  mealImage: {
    marginBottom: 10,
  },
  mealInfo: {
    padding: 10,
  },
  mealName: {
    marginBottom: 5,
  },
  mealPrice: {
    marginBottom: 5,
  },
  deliveryTime: {
    marginTop: 5,
  },
});

