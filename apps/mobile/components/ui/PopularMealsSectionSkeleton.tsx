import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface PopularMealsSectionSkeletonProps {
  itemCount?: number;
}

export const PopularMealsSectionSkeleton: React.FC<PopularMealsSectionSkeletonProps> = ({
  itemCount = 8,
}) => {
  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={styles.skeletonCard}
    >
      {/* Image skeleton */}
      <View style={styles.skeletonImage} />
      
      {/* Content skeleton */}
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonLine, styles.skeletonSentiment]} />
          <View style={[styles.skeletonLine, styles.skeletonTime]} />
        </View>
        <View style={[styles.skeletonLine, styles.skeletonPrice]} />
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

      {/* First Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {Array.from({ length: Math.min(4, itemCount) }).map((_, index) =>
          renderSkeletonCard(index)
        )}
      </ScrollView>

      {/* Second Row */}
      {itemCount > 4 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Array.from({ length: Math.min(4, itemCount - 4) }).map((_, index) =>
            renderSkeletonCard(index + 4)
          )}
        </ScrollView>
      )}
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
    width: 120,
    height: 24,
  },
  skeletonSeeAll: {
    width: 60,
    height: 16,
  },
  scrollView: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingLeft: 12,
    gap: 12,
  },
  skeletonCard: {
    width: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  skeletonImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonContent: {
    padding: 12,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTitle: {
    width: '80%',
    height: 14,
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: '60%',
    height: 11,
    marginBottom: 6,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  skeletonSentiment: {
    width: 40,
    height: 10,
  },
  skeletonTime: {
    width: 50,
    height: 10,
  },
  skeletonPrice: {
    width: '40%',
    height: 14,
  },
});

