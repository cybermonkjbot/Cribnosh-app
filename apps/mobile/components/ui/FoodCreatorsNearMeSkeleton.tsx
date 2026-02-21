import React from 'react';
import { StyleSheet, View } from 'react-native';

interface FoodCreatorsNearMeSkeletonProps {
  itemCount?: number;
}

export const FoodCreatorsNearMeSkeleton: React.FC<FoodCreatorsNearMeSkeletonProps> = ({
  itemCount = 2,
}) => {
  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonLine, styles.skeletonTitle]} />
          <View style={styles.skeletonBadge} />
        </View>
        <View style={[styles.skeletonLine, styles.skeletonDescription]} />
        <View style={[styles.skeletonLine, styles.skeletonDistance]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title skeleton */}
      <View style={styles.titleContainer}>
        <View style={[styles.skeletonLine, styles.skeletonTitleText]} />
        <View style={styles.titleActions}>
          <View style={[styles.skeletonLine, styles.skeletonButton]} />
          <View style={[styles.skeletonLine, styles.skeletonArrow]} />
        </View>
      </View>

      {Array.from({ length: itemCount }).map((_, index) =>
        renderSkeletonCard(index)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonTitleText: {
    width: 140,
    height: 18,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonButton: {
    width: 60,
    height: 32,
    borderRadius: 20,
  },
  skeletonArrow: {
    width: 16,
    height: 16,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  skeletonTitle: {
    width: 120,
    height: 16,
    marginRight: 6,
  },
  skeletonBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonDescription: {
    width: '90%',
    height: 14,
    marginBottom: 4,
  },
  skeletonDistance: {
    width: '60%',
    height: 12,
  },
});

