import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function DietCompatibilityBarSkeleton() {
  return (
    <View style={styles.container}>
      {/* Label */}
      <SkeletonBox width={150} height={16} borderRadius={4} style={styles.label} />
      
      {/* Progress Bar Container */}
      <View style={styles.progressBarContainer}>
        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          <SkeletonBox width="60%" height={4} borderRadius={2} />
        </View>
        
        {/* Percentage Display */}
        <SkeletonBox width={35} height={16} borderRadius={4} style={styles.percentage} />
        
        {/* Fire Icon Container */}
        <SkeletonBox width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  label: {
    marginBottom: 15,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
    borderRadius: 2,
    marginRight: 15,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  percentage: {
    marginRight: 10,
  },
});

