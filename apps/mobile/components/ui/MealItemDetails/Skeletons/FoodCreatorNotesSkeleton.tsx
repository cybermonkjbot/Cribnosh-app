import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from './ShimmerBox';

export function FoodCreatorNotesSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <SkeletonBox width={140} height={20} borderRadius={4} style={styles.header} />

      <View style={styles.notesContainer}>
        {/* Food Creator Info */}
        <View style={styles.foodCreatorInfo}>
          <SkeletonBox width={48} height={48} borderRadius={24} style={styles.foodCreatorAvatar} />
          <View style={styles.foodCreatorDetails}>
            <SkeletonBox width={120} height={16} borderRadius={4} style={styles.foodCreatorName} />
            <SkeletonBox width={100} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Story Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonBox width={16} height={16} borderRadius={8} />
            <SkeletonBox width={80} height={16} borderRadius={4} style={styles.sectionTitle} />
          </View>
          <SkeletonBox width="100%" height={14} borderRadius={4} style={styles.storyLine} />
          <SkeletonBox width="95%" height={14} borderRadius={4} style={styles.storyLine} />
          <SkeletonBox width="85%" height={14} borderRadius={4} />
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SkeletonBox width={16} height={16} borderRadius={8} />
            <SkeletonBox width={100} height={16} borderRadius={4} style={styles.sectionTitle} />
          </View>
          <SkeletonBox width="90%" height={14} borderRadius={4} style={styles.tipLine} />
          <SkeletonBox width="95%" height={14} borderRadius={4} style={styles.tipLine} />
          <SkeletonBox width="88%" height={14} borderRadius={4} />
        </View>
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
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  foodCreatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  foodCreatorAvatar: {
    marginRight: 12,
  },
  foodCreatorDetails: {
    flex: 1,
    gap: 4,
  },
  foodCreatorName: {
    marginBottom: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    marginLeft: 0,
  },
  storyLine: {
    marginBottom: 6,
  },
  tipLine: {
    marginBottom: 8,
  },
});

