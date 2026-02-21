import { StyleSheet, Text, View } from 'react-native';

interface FoodCreatorNotesProps {
  story?: string;
  tips?: string[];
  foodCreatorName?: string;
  foodCreatorAvatar?: string;
}

export function FoodCreatorNotes({ story, tips, foodCreatorName, foodCreatorAvatar }: FoodCreatorNotesProps) {
  return (
    <View style={styles.container}>
      <View style={styles.notesContainer}>
        {/* Food Creator Info */}
        <View style={styles.foodCreatorInfo}>
          <Text style={styles.header}>Food Creator&apos;s Notes</Text>
          <Text style={styles.foodCreatorName}>{foodCreatorName || "Food Creator&apos;s Special"}</Text>
          <Text style={styles.foodCreatorSubtitle}>Personal Recipe</Text>
        </View>
      </View>

      {/* Story */}
      {story && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Story</Text>
          <Text style={styles.storyText}>{story}</Text>
        </View>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Creator&apos;s Tips</Text>
          {tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipBullet}>
                <Text style={styles.bulletText}>•</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#094327',
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
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  foodCreatorDetails: {
    flex: 1,
  },
  foodCreatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    marginBottom: 2,
  },
  foodCreatorSubtitle: {
    fontSize: 14,
    color: '#6C757D',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    marginBottom: 8,
  },
  storyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    width: 20,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
  },
}); 