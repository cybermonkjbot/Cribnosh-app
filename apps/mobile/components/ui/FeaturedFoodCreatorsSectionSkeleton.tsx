import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface FeaturedFoodCreatorsSectionSkeletonProps {
  itemCount?: number;
}

export const FeaturedFoodCreatorsSectionSkeleton: React.FC<FeaturedFoodCreatorsSectionSkeletonProps> = ({
  itemCount = 4,
}) => {
  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImageContainer}>
        <View style={styles.skeletonImage} />
        {/* LIVE Badge skeleton (left side) */}
        <View style={styles.skeletonLiveBadge} />
        {/* Sentiment Badge skeleton (right side) */}
        <View style={styles.skeletonBadge} />
      </View>
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonLine, styles.skeletonTime]} />
          <View style={[styles.skeletonLine, styles.skeletonDistance]} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title skeleton */}
      <View style={styles.titleContainer}>
        <View style={[styles.skeletonLine, styles.skeletonTitleText]} />
        <View style={[styles.skeletonLine, styles.skeletonSeeAll]} />
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
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  skeletonTitleText: {
    width: 140,
    height: 24,
  },
  skeletonSeeAll: {
    width: 60,
    height: 16,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  skeletonCard: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  skeletonImageContainer: {
    position: 'relative',
  },
  skeletonImage: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonLiveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 50,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  skeletonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  skeletonContent: {
    padding: 12,
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
  skeletonSubtitle: {
    width: '60%',
    height: 12,
    marginBottom: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonTime: {
    width: 50,
    height: 11,
  },
  skeletonDistance: {
    width: 50,
    height: 11,
  },
});

