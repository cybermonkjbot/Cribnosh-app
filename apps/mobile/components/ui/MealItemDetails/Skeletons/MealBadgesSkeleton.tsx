import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function MealBadgesSkeleton() {
  return (
    <View style={styles.badgesContainer}>
      <SkeletonBox width={100} height={32} borderRadius={20} />
      <SkeletonBox width={120} height={32} borderRadius={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
});

