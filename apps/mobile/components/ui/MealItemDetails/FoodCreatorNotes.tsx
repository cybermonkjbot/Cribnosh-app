import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FoodCreatorNotesProps {
  story?: string;
  tips?: string[];
  chefName?: string;
  chefAvatar?: string;
}

export function FoodCreatorNotes({ story, tips, chefName, chefAvatar }: FoodCreatorNotesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chef&apos;s Notes</Text>
      
      <View style={styles.notesContainer}>
        {/* Chef Info */}
        <View style={styles.chefInfo}>
          <View style={styles.chefDetails}>
            <Text style={styles.chefName}>{chefName || "Chef&apos;s Special"}</Text>
            <Text style={styles.chefSubtitle}>Personal Recipe</Text>
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
            <Text style={styles.sectionTitle}>Chef&apos;s Tips</Text>
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
  chefInfo: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chefDetails: {
    flex: 1,
  },
  chefName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    marginBottom: 2,
  },
  chefSubtitle: {
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