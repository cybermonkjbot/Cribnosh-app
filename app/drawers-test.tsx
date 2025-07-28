import { FeaturedKitchensDrawer } from '@/components/ui/FeaturedKitchensDrawer';
import { PopularMealsDrawer } from '@/components/ui/PopularMealsDrawer';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DrawersTestScreen() {
  const [activeDrawer, setActiveDrawer] = useState<'featuredKitchens' | 'popularMeals' | null>(null);

  const handleOpenFeaturedKitchens = () => {
    setActiveDrawer('featuredKitchens');
  };

  const handleOpenPopularMeals = () => {
    setActiveDrawer('popularMeals');
  };

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
  };

  const handleKitchenPress = (kitchen: any) => {
    console.log('Kitchen pressed:', kitchen.name);
    // In a real app, this would navigate to kitchen details
  };

  const handleMealPress = (meal: any) => {
    console.log('Meal pressed:', meal.name);
    // In a real app, this would navigate to meal details
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Category Drawers Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏪 Featured Kitchens Drawer</Text>
          <Text style={styles.description}>
            Full-screen drawer showing all featured kitchens with filtering options
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleOpenFeaturedKitchens}
          >
            <Text style={styles.buttonText}>Open Featured Kitchens</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ Popular Meals Drawer</Text>
          <Text style={styles.description}>
            Full-screen drawer showing all popular meals with filtering options
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleOpenPopularMeals}
          >
            <Text style={styles.buttonText}>Open Popular Meals</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Full-screen drawer interface</Text>
            <Text style={styles.featureItem}>• Filter chips for different categories</Text>
            <Text style={styles.featureItem}>• Search functionality</Text>
            <Text style={styles.featureItem}>• Multiple sections (Live, Popular, New, etc.)</Text>
            <Text style={styles.featureItem}>• Kitchen sentiment ratings</Text>
            <Text style={styles.featureItem}>• Meal sentiment ratings</Text>
            <Text style={styles.featureItem}>• Delivery time and distance info</Text>
            <Text style={styles.featureItem}>• Price and discount information</Text>
          </View>
        </View>
      </ScrollView>

      {/* Featured Kitchens Drawer */}
      {activeDrawer === 'featuredKitchens' && (
        <FeaturedKitchensDrawer
          onBack={handleCloseDrawer}
          onKitchenPress={handleKitchenPress}
        />
      )}

      {/* Popular Meals Drawer */}
      {activeDrawer === 'popularMeals' && (
        <PopularMealsDrawer
          onBack={handleCloseDrawer}
          onMealPress={handleMealPress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  content: {
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
  button: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
}); 