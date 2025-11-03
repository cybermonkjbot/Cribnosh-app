import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

interface TakeAwaysSkeletonProps {
  itemCount?: number;
}

export const TakeAwaysSkeleton: React.FC<TakeAwaysSkeletonProps> = ({
  itemCount = 3,
}) => {
  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonDescription]} />
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonLine, styles.skeletonPrice]} />
          <View style={styles.skeletonButton} />
        </View>
      </View>
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
    width: 120,
    height: 18,
  },
  skeletonArrow: {
    width: 16,
    height: 16,
  },
  scrollContent: {
    paddingLeft: 16,
  },
  skeletonCard: {
    width: 180,
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
  skeletonImage: {
    width: '100%',
    height: 100,
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
    marginBottom: 4,
  },
  skeletonDescription: {
    width: '100%',
    height: 11,
    marginBottom: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPrice: {
    width: 60,
    height: 16,
  },
  skeletonButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
});

