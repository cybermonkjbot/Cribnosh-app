import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function MealTitleSkeleton() {
  return (
    <View style={styles.container}>
      {/* Logo placeholder */}
      <View style={styles.logoContainer}>
        <SkeletonBox width={80} height={20} borderRadius={4} />
      </View>
      
      {/* Title placeholder */}
      <SkeletonBox width="90%" height={70} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
    gap: 10,
  },
  logoContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
});

