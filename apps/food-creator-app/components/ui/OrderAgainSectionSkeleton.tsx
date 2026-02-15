import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface OrderAgainSectionSkeletonProps {
  itemCount?: number;
}

export const OrderAgainSectionSkeleton: React.FC<OrderAgainSectionSkeletonProps> = ({
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
        <View style={[styles.skeletonLine, styles.skeletonPrice]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title skeleton */}
      <View style={styles.titleContainer}>
        <View style={[styles.skeletonLine, styles.skeletonTitleText]} />
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
    paddingTop: 28,
  },
  titleContainer: {
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  skeletonTitleText: {
    width: 120,
    height: 20,
  },
  scrollContent: {
    paddingLeft: 10,
    gap: 12,
  },
  skeletonCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  skeletonImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  skeletonBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 50,
    height: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  skeletonContent: {
    gap: 4,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
  },
  skeletonTitle: {
    width: '80%',
    height: 12,
    marginBottom: 4,
  },
  skeletonPrice: {
    width: '40%',
    height: 14,
  },
});

