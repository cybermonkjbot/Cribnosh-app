import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

interface OrderCardSkeletonProps {
  showSeparator?: boolean;
}

export function OrderCardSkeleton({ showSeparator = true }: OrderCardSkeletonProps) {
  return (
    <View style={styles.container}>
      <View style={styles.orderItem}>
        {/* Icon Skeleton */}
        <View style={styles.iconContainer}>
          <SkeletonBox width={48} height={48} borderRadius={8} />
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          {/* Header Row */}
          <View style={styles.orderHeader}>
            <View style={styles.timeAndOrderNumber}>
              <SkeletonBox width={120} height={14} borderRadius={4} />
            </View>
            <View style={styles.headerRight}>
              <SkeletonBox width={80} height={24} borderRadius={12} />
            </View>
          </View>

          {/* Order Number */}
          <View style={styles.orderNumberContainer}>
            <SkeletonBox width={180} height={12} borderRadius={4} />
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <SkeletonBox width="90%" height={16} borderRadius={4} />
            <SkeletonBox width="60%" height={16} borderRadius={4} style={{ marginTop: 4 }} />
          </View>

          {/* Items (for ongoing orders) */}
          <View style={styles.itemsContainer}>
            <SkeletonBox width={200} height={13} borderRadius={4} />
          </View>

          {/* Footer */}
          <View style={styles.orderFooter}>
            <SkeletonBox width={70} height={16} borderRadius={4} />
            <SkeletonBox width={60} height={13} borderRadius={4} />
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <SkeletonBox width={12} height={20} borderRadius={2} />
        </View>
      </View>
      {showSeparator && <View style={styles.separator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginRight: 12,
    marginLeft: 4,
    marginTop: 2,
  },
  orderDetails: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  timeAndOrderNumber: {
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  orderNumberContainer: {
    marginBottom: 6,
  },
  descriptionContainer: {
    marginBottom: 6,
  },
  itemsContainer: {
    marginBottom: 6,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  arrowContainer: {
    marginRight: 4,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(229, 231, 235, 0.5)',
    marginTop: 8,
    marginHorizontal: 12,
  },
});
