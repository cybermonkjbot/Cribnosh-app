import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface TopKebabsSkeletonProps {
  itemCount?: number;
}

export const TopKebabsSkeleton: React.FC<TopKebabsSkeletonProps> = ({
  itemCount = 3,
}) => {
  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImage} />
      <View style={[styles.skeletonLine, styles.skeletonTitle]} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title skeleton */}
      <View style={styles.titleContainer}>
        <View style={[styles.skeletonLine, styles.skeletonTitleText]} />
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
  skeletonTitleText: {
    width: 140,
    height: 18,
  },
  skeletonArrow: {
    width: 16,
    height: 16,
  },
  scrollContent: {
    paddingLeft: 20,
  },
  skeletonCard: {
    alignItems: 'center',
    marginRight: 24,
  },
  skeletonImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    marginBottom: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
  },
  skeletonTitle: {
    width: 60,
    height: 12,
  },
});

