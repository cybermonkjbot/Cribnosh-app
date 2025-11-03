import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CuisineCategoriesSectionSkeletonProps {
  itemCount?: number;
}

export const CuisineCategoriesSectionSkeleton: React.FC<CuisineCategoriesSectionSkeletonProps> = ({
  itemCount = 4,
}) => {
  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonOverlay} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
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

      {/* Grid Layout */}
      <View style={styles.gridContainer}>
        {Array.from({ length: itemCount }).map((_, index) =>
          renderSkeletonCard(index)
        )}
      </View>
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  skeletonCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
    position: 'relative',
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  skeletonContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTitle: {
    width: '70%',
    height: 16,
    marginBottom: 4,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 12,
  },
});

