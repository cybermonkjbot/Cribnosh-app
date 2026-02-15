import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface LoadingStateProps {
  style?: ViewStyle;
  itemCount?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  style,
  itemCount = 3,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
            <View style={[styles.skeletonLine, styles.skeletonLinePrice]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  skeletonIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    marginRight: 16,
    marginLeft: 8,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonLineShort: {
    width: '60%',
  },
  skeletonLinePrice: {
    width: '30%',
    height: 14,
  },
}); 