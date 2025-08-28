import { KitchenRating } from '@/components/ui/KitchenRating';
import { SentimentRating } from '@/components/ui/SentimentRating';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SentimentTestScreen() {
  const allSentiments = [
    'bussing', 'fire', 'slaps', 'elite', 'decent', 'solid', 'average', 'mid', 'meh', 'notIt', 'trash', 'skip'
  ] as const;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Enhanced Sentiment Rating System</Text>
      
      {/* Meal Sentiments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ Meal Sentiments</Text>
        <Text style={styles.description}>
          Individual meal ratings with expanded sentiment options
        </Text>
        
        <View style={styles.sentimentGrid}>
          {allSentiments.map((sentiment) => (
            <View key={sentiment} style={styles.sentimentItem}>
              <Text style={styles.sentimentLabel}>{sentiment}</Text>
              <SentimentRating sentiment={sentiment} />
            </View>
          ))}
        </View>
      </View>

      {/* Kitchen Sentiments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏪 Kitchen Sentiments</Text>
        <Text style={styles.description}>
          Aggregate kitchen ratings with expanded sentiment options
        </Text>
        
        <View style={styles.sentimentGrid}>
          {allSentiments.map((sentiment) => (
            <View key={sentiment} style={styles.sentimentItem}>
              <Text style={styles.sentimentLabel}>{sentiment}</Text>
              <KitchenRating sentiment={sentiment} />
            </View>
          ))}
        </View>
      </View>

      {/* Size Variations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📏 Size Variations</Text>
        <Text style={styles.description}>
          Different sizes for different UI contexts
        </Text>
        
        <View style={styles.sizeRow}>
          <View style={styles.sizeItem}>
            <Text style={styles.sizeLabel}>Small</Text>
            <SentimentRating sentiment="elite" size="small" />
          </View>
          <View style={styles.sizeItem}>
            <Text style={styles.sizeLabel}>Medium</Text>
            <SentimentRating sentiment="fire" size="medium" />
          </View>
          <View style={styles.sizeItem}>
            <Text style={styles.sizeLabel}>Large</Text>
            <SentimentRating sentiment="slaps" size="large" />
          </View>
        </View>
      </View>

      {/* Compact Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Compact Mode</Text>
        <Text style={styles.description}>
          Shorter labels for space-constrained UI elements
        </Text>
        
        <View style={styles.compactRow}>
          <View style={styles.compactItem}>
            <Text style={styles.compactLabel}>Normal</Text>
            <KitchenRating sentiment="elite" />
          </View>
          <View style={styles.compactItem}>
            <Text style={styles.compactLabel}>Compact</Text>
            <KitchenRating sentiment="elite" compact={true} />
          </View>
        </View>
      </View>

      {/* Sentiment Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Sentiment Categories</Text>
        
        <View style={styles.categorySection}>
          <View style={styles.categoryTitle}>
            <Ionicons name="flame" size={16} color="#FF6B35" style={{ marginRight: 6 }} />
            <Text style={styles.categoryTitleText}>Positive Sentiments</Text>
          </View>
          <View style={styles.categoryGrid}>
            <SentimentRating sentiment="bussing" />
            <SentimentRating sentiment="fire" />
            <SentimentRating sentiment="slaps" />
            <SentimentRating sentiment="elite" />
          </View>
        </View>

        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>😐 Neutral Sentiments</Text>
          <View style={styles.categoryGrid}>
            <SentimentRating sentiment="decent" />
            <SentimentRating sentiment="solid" />
            <SentimentRating sentiment="average" />
            <SentimentRating sentiment="mid" />
          </View>
        </View>

        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>😕 Negative Sentiments</Text>
          <View style={styles.categoryGrid}>
            <SentimentRating sentiment="meh" />
            <SentimentRating sentiment="notIt" />
            <SentimentRating sentiment="trash" />
            <SentimentRating sentiment="skip" />
          </View>
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
  sentimentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sentimentItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  sentimentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sizeItem: {
    alignItems: 'center',
  },
  sizeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  compactItem: {
    alignItems: 'center',
  },
  compactLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
}); 