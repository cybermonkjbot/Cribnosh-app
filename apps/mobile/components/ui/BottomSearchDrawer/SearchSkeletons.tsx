import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../MealItemDetails/Skeletons/ShimmerBox';

/**
 * Skeleton loader for search suggestions/results
 */
export const SearchSuggestionsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.suggestionItem}>
          {/* Icon skeleton */}
          <SkeletonBox width={36} height={36} borderRadius={18} style={styles.icon} />
          
          {/* Content skeleton */}
          <View style={styles.content}>
            <SkeletonBox width={150} height={16} borderRadius={4} style={styles.title} />
            <SkeletonBox width={200} height={14} borderRadius={4} style={styles.subtitle} />
          </View>
          
          {/* Action icon skeleton */}
          <SkeletonBox width={28} height={28} borderRadius={14} style={styles.actionIcon} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
  },
  icon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 5,
  },
  subtitle: {
    marginTop: 3,
  },
  actionIcon: {
    marginLeft: 8,
  },
});

