import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface TooFreshToWasteSkeletonProps {
  itemCount?: number;
}

export const TooFreshToWasteSkeleton: React.FC<TooFreshToWasteSkeletonProps> = ({
  itemCount = 3,
}) => {
  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImageContainer}>
        <View style={styles.skeletonImage} />
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonCuisine]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title skeleton */}
      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <View style={[styles.skeletonLine, styles.skeletonTitleText]} />
          <View style={styles.skeletonIcon} />
        </View>
        <View style={[styles.skeletonLine, styles.skeletonArrow]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Array.from({ length: itemCount }).map((_, index) =>
          renderSkeletonCard(index)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonTitleText: {
    width: 100,
    height: 18,
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonArrow: {
    width: 16,
    height: 16,
  },
  scrollContent: {
    paddingLeft: 20,
  },
  skeletonCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonImageContainer: {
    position: 'relative',
  },
  skeletonImage: {
    width: 120,
    height: 140,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  skeletonContent: {
    padding: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    marginBottom: 2,
  },
  skeletonTitle: {
    width: '80%',
    height: 14,
    marginBottom: 2,
  },
  skeletonCuisine: {
    width: '60%',
    height: 12,
  },
});

