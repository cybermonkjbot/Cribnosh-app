import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface SpecialOffersSectionSkeletonProps {
  itemCount?: number;
}

export const SpecialOffersSectionSkeleton: React.FC<SpecialOffersSectionSkeletonProps> = ({
  itemCount = 3,
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
        <View style={[styles.skeletonLine, styles.skeletonDescription]} />
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonLine, styles.skeletonDate]} />
          <View style={[styles.skeletonLine, styles.skeletonButton]} />
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
    paddingLeft: 12,
  },
  skeletonCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  skeletonImage: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonContent: {
    padding: 16,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTitle: {
    width: '80%',
    height: 16,
    marginBottom: 4,
  },
  skeletonDescription: {
    width: '100%',
    height: 13,
    marginBottom: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonDate: {
    width: 100,
    height: 12,
  },
  skeletonButton: {
    width: 80,
    height: 32,
    borderRadius: 20,
  },
});

