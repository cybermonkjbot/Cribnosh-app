import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';

interface SustainabilityDrawerProps {
  onBack: () => void;
}

export function SustainabilityDrawer({ onBack }: SustainabilityDrawerProps) {
  return (
    <CategoryFullDrawer
      categoryName="Cribnosh's Sustainability"
      categoryDescription="We partner with local chefs to reduce food waste, promote conscious cooking, and make sure good food never goes to waste."
      onBack={onBack}
      filterChips={[]}
      activeFilters={[]}
      searchPlaceholder=""
      showTabs={false}
      showSearch={false}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Why it matters section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why it matters:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Ionicons name="leaf" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Less waste from over-prepping</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="cart" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Smarter use of leftover groceries</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="reload" size={16} color="#10B981" style={styles.bulletIcon} />
              <Text style={styles.bulletText}>Lower footprint, every meal</Text>
            </View>
          </View>
        </View>

        {/* How we do it section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How we do it</Text>
          
          <View style={styles.numberedList}>
            <View style={styles.numberedItem}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>1</Text>
              </View>
              <View style={styles.numberedContent}>
                <Text style={styles.numberedTitle}>Smarter FoodCreators</Text>
                <Text style={styles.numberedDescription}>
                  Our foodCreators cook with precision, planning meals around real demand and shared grocery pools — not bulk waste.
                </Text>
              </View>
            </View>

            <View style={styles.numberedItem}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>2</Text>
              </View>
              <View style={styles.numberedContent}>
                <Text style={styles.numberedTitle}>Too Fresh to Waste</Text>
                <Text style={styles.numberedDescription}>
                  Perfectly good meals and ingredients that didn&apos;t get served in time are offered at lower prices. Still fresh, still top-tier, never thrown away.
                </Text>
              </View>
            </View>

            <View style={styles.numberedItem}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>3</Text>
              </View>
              <View style={styles.numberedContent}>
                <Text style={styles.numberedTitle}>Shared FoodCreator Model</Text>
                <Text style={styles.numberedDescription}>
                  By connecting certified foodCreators with passionate home chefs, we reduce the need for duplicate equipment, energy use, and unnecessary space.
                </Text>
              </View>
            </View>

            <View style={styles.numberedItem}>
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>4</Text>
              </View>
              <View style={styles.numberedContent}>
                <Text style={styles.numberedTitle}>Delivery with Intention</Text>
                <Text style={styles.numberedDescription}>
                  We batch and route deliveries smartly, reducing mileage and emissions on every order.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.everyOrderSection}>
            <Text style={styles.everyOrderText}>
              Every Order Matters
            </Text>
            <Text style={styles.everyOrderDescription}>
              Choosing Cribnosh means you&apos;re supporting small food creators, reducing local food waste, and helping build a more sustainable food future.
            </Text>
          </View>
        </View>

        {/* Too Fresh to Waste Graphic */}
        <View style={styles.graphicSection}>
          <View style={styles.graphicContainer}>
            <Text style={styles.graphicTitle}>TOO FRESH TO WASTE</Text>
            <View style={styles.foodIllustrations}>
              <View style={styles.foodItem}>
                <View style={styles.tomato} />
                <Text style={styles.foodLabel}>Fresh</Text>
              </View>
              <View style={styles.foodItem}>
                <View style={styles.bowl} />
                <Text style={styles.foodLabel}>Quality</Text>
              </View>
              <View style={styles.foodItem}>
                <View style={styles.bag} />
                <Text style={styles.foodLabel}>Local</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              High-quality meals and groceries that didn&apos;t make it to full menu — still fresh, still delicious, priced to move. Good for you, good for the foodCreator, great for the planet.
            </Text>
            <Ionicons name="reload" size={24} color="#10B981" style={styles.recycleIcon} />
          </View>
        </View>
      </ScrollView>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 16,
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletIcon: {
    marginRight: 4,
  },
  bulletText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    flex: 1,
  },
  numberedList: {
    gap: 20,
  },
  numberedItem: {
    flexDirection: 'row',
    gap: 16,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  numberedContent: {
    flex: 1,
  },
  numberedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 4,
  },
  numberedDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  everyOrderSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  everyOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#094327',
    marginBottom: 8,
  },
  everyOrderDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  graphicSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  graphicContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    width: '100%',
  },
  graphicTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 20,
    textAlign: 'center',
  },
  foodIllustrations: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  foodItem: {
    alignItems: 'center',
    gap: 8,
  },
  tomato: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  bowl: {
    width: 50,
    height: 30,
    borderRadius: 25,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  bag: {
    width: 35,
    height: 45,
    backgroundColor: '#10B981',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#059669',
  },
  foodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    flex: 1,
  },
  recycleIcon: {
    marginTop: 2,
  },
}); 