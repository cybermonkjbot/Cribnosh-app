import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function KitchenInfoSkeleton() {
  return (
    <View style={styles.container}>
      {/* Avatar container with confetti positions */}
      <View style={styles.avatarContainer}>
        <SkeletonBox width={50} height={50} borderRadius={25} />
        {/* Confetti placeholders */}
        <View style={styles.confetti1}>
          <SkeletonBox width={8} height={8} borderRadius={4} />
        </View>
        <View style={styles.confetti2}>
          <SkeletonBox width={6} height={6} borderRadius={3} />
        </View>
        <View style={styles.confetti3}>
          <SkeletonBox width={4} height={4} borderRadius={2} />
        </View>
      </View>
      
      {/* Name container */}
      <View style={styles.nameContainer}>
        <SkeletonBox width={120} height={16} borderRadius={4} style={styles.kitchenName} />
        <SkeletonBox width={150} height={24} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    marginRight: 15,
  },
  confetti1: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  confetti2: {
    position: 'absolute',
    bottom: -1,
    left: -1,
  },
  confetti3: {
    position: 'absolute',
    top: 5,
    right: -3,
  },
  nameContainer: {
    flex: 1,
    gap: 4,
  },
  kitchenName: {
    marginBottom: 2,
  },
});

