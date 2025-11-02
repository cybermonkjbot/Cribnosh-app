import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function MealImageSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBox width={280} height={320} borderRadius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
});

