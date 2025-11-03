import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function MealDescriptionSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBox width="100%" height={16} borderRadius={4} style={styles.line} />
      <SkeletonBox width="85%" height={16} borderRadius={4} style={styles.line} />
      <SkeletonBox width="70%" height={16} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
    gap: 8,
  },
  line: {
    marginBottom: 6,
  },
});

