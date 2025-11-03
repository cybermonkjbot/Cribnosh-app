import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function MealIngredientsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <SkeletonBox width={120} height={20} borderRadius={4} style={styles.header} />
      
      {/* Chips Container */}
      <View style={styles.chipsContainer}>
        <SkeletonBox width={120} height={32} borderRadius={20} />
        <SkeletonBox width={100} height={32} borderRadius={20} />
        <SkeletonBox width={110} height={32} borderRadius={20} />
        <SkeletonBox width={90} height={32} borderRadius={20} />
        <SkeletonBox width={130} height={32} borderRadius={20} />
        <SkeletonBox width={95} height={32} borderRadius={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  header: {
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

