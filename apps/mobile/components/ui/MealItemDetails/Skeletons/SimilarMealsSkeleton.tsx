import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function SimilarMealsSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <SkeletonBox width={160} height={20} borderRadius={4} style={styles.header} />
      
      {/* Horizontal Scroll of Meal Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.mealCard}>
            {/* Meal Image */}
            <SkeletonBox width={160} height={120} borderRadius={0} style={styles.mealImage} />
            
            {/* Meal Info */}
            <View style={styles.mealInfo}>
              <SkeletonBox width="90%" height={16} borderRadius={4} style={styles.mealName} />
              <SkeletonBox width="60%" height={16} borderRadius={4} style={styles.mealName} />
              
              <View style={styles.mealMeta}>
                <SkeletonBox width={60} height={16} borderRadius={4} />
                <SkeletonBox width={50} height={14} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
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
  scrollContainer: {
    paddingRight: 20,
  },
  mealCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  mealImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  mealInfo: {
    padding: 12,
  },
  mealName: {
    marginBottom: 8,
  },
  mealMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
});

