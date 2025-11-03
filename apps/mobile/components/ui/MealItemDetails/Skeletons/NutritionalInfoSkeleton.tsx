import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function NutritionalInfoSkeleton() {
  return (
    <View style={styles.container}>
      {/* Main Heading */}
      <SkeletonBox width={200} height={24} borderRadius={4} style={styles.mainHeading} />
      
      {/* Subtitle */}
      <SkeletonBox width="95%" height={16} borderRadius={4} style={styles.subtitle} />
      <SkeletonBox width="80%" height={16} borderRadius={4} style={styles.subtitleLine} />
      
      {/* Calories and Macros Section */}
      <View style={styles.nutritionSection}>
        {/* Left Side - Calories */}
        <View style={styles.caloriesSection}>
          <View style={styles.caloriesContainer}>
            <SkeletonBox width={12} height={12} borderRadius={6} style={styles.caloriesIcon} />
            <SkeletonBox width={50} height={12} borderRadius={4} style={styles.caloriesLabel} />
            <SkeletonBox width={70} height={24} borderRadius={4} style={styles.caloriesValue} />
          </View>
        </View>
        
        {/* Right Side - Macronutrients */}
        <View style={styles.macrosSection}>
          {/* Fat Circle */}
          <View style={styles.macroItem}>
            <SkeletonBox width={50} height={50} borderRadius={25} />
          </View>
          
          {/* Protein Circle */}
          <View style={styles.macroItem}>
            <SkeletonBox width={50} height={50} borderRadius={25} />
          </View>
          
          {/* Carbs Circle */}
          <View style={styles.macroItem}>
            <SkeletonBox width={50} height={50} borderRadius={25} />
          </View>
        </View>
      </View>
      
      {/* Diet Message */}
      <View style={styles.dietMessageContainer}>
        <SkeletonBox width={16} height={16} borderRadius={8} style={styles.avatar} />
        <SkeletonBox width="80%" height={32} borderRadius={15} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  mainHeading: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 6,
  },
  subtitleLine: {
    marginBottom: 20,
  },
  nutritionSection: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  caloriesSection: {
    marginRight: 15,
  },
  caloriesContainer: {
    position: 'relative',
    width: 80,
    height: 45,
  },
  caloriesIcon: {
    position: 'absolute',
    left: 0,
    top: 15,
  },
  caloriesLabel: {
    position: 'absolute',
    left: 15,
    top: 0,
  },
  caloriesValue: {
    position: 'absolute',
    left: 15,
    top: 15,
  },
  macrosSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroItem: {
    alignItems: 'center',
  },
  dietMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    marginRight: 8,
  },
});

