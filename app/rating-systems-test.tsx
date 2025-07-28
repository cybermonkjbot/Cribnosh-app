import { KitchenRating } from '@/components/ui/KitchenRating';
import { SentimentRating } from '@/components/ui/SentimentRating';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RatingSystemsTestScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rating Systems Comparison</Text>
      
      {/* Meal Sentiment System */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ Meal Sentiment System</Text>
        <Text style={styles.description}>
          Used for individual meal ratings - how much users enjoyed the specific dish
        </Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Bussing (Excellent)</Text>
            <SentimentRating sentiment="bussing" />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Mid (Average)</Text>
            <SentimentRating sentiment="mid" />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Not It (Poor)</Text>
            <SentimentRating sentiment="notIt" />
          </View>
        </View>
      </View>
      
      {/* Kitchen Sentiment System */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏪 Kitchen Sentiment System</Text>
        <Text style={styles.description}>
          Aggregate sentiment from all meals by a kitchen - shows the dominant mood
        </Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Mostly Bussing</Text>
            <KitchenRating sentiment="bussing" size="medium" />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Mostly Mid</Text>
            <KitchenRating sentiment="mid" size="medium" />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Mostly Not It</Text>
            <KitchenRating sentiment="notIt" size="medium" />
          </View>
        </View>
      </View>
      
      {/* Kitchen Sentiment Sizes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📏 Kitchen Sentiment Sizes</Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Small</Text>
            <KitchenRating sentiment="bussing" size="small" />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Medium</Text>
            <KitchenRating sentiment="bussing" size="medium" />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Large</Text>
            <KitchenRating sentiment="bussing" size="large" />
          </View>
        </View>
      </View>
      
      {/* Kitchen Sentiment Without Labels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Kitchen Sentiment (Icon Only)</Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Mostly Bussing</Text>
            <KitchenRating sentiment="bussing" showLabel={false} />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Mostly Mid</Text>
            <KitchenRating sentiment="mid" showLabel={false} />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Mostly Not It</Text>
            <KitchenRating sentiment="notIt" showLabel={false} />
          </View>
        </View>
      </View>
      
      {/* Compact Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Compact Mode (For Live Badges)</Text>
        <Text style={styles.description}>
          Shorter labels to prevent overlap with Live badges on kitchen cards
        </Text>
        
        <View style={styles.ratingRow}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Compact Bussing</Text>
            <KitchenRating sentiment="bussing" size="small" compact={true} />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Compact Mid</Text>
            <KitchenRating sentiment="mid" size="small" compact={true} />
          </View>
          
          <View style={styles.ratingItem}>
            <Text style={styles.ratingLabel}>Compact Not It</Text>
            <KitchenRating sentiment="notIt" size="small" compact={true} />
          </View>
        </View>
        
        <View style={styles.compactExample}>
          <Text style={styles.exampleTitle}>Live Kitchen Example:</Text>
          <View style={styles.liveKitchenCard}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <KitchenRating sentiment="bussing" size="small" compact={true} />
          </View>
        </View>
      </View>
      
      {/* Usage Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Usage Examples</Text>
        
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>Individual Meal:</Text>
          <Text style={styles.exampleText}>
            "This Shawarma was <Text style={styles.highlight}>bussing</Text> - I loved it!"
          </Text>
        </View>
        
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>Kitchen Aggregate:</Text>
          <Text style={styles.exampleText}>
            "Amara's Kitchen is <Text style={styles.highlight}>mostly bussing</Text> - their meals are consistently great!"
          </Text>
        </View>
        
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>Mixed Kitchen:</Text>
          <Text style={styles.exampleText}>
            "Bangkok Bites is <Text style={styles.highlight}>mostly mid</Text> - some dishes are good, others are just okay."
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#094327',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ratingItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  exampleContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  highlight: {
    color: '#10B981',
    fontWeight: '600',
  },
  compactExample: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  liveKitchenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
}); 