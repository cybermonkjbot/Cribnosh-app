import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function MealInfoSkeleton() {
  return (
    <View style={styles.container}>
      {/* Prep Time */}
      <View style={styles.infoItem}>
        <SkeletonBox width={16} height={16} borderRadius={8} />
        <SkeletonBox width={40} height={12} borderRadius={4} />
        <SkeletonBox width={50} height={14} borderRadius={4} />
      </View>

      {/* Delivery Time */}
      <View style={styles.infoItem}>
        <SkeletonBox width={16} height={16} borderRadius={8} />
        <SkeletonBox width={50} height={12} borderRadius={4} />
        <SkeletonBox width={50} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 40,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
});

