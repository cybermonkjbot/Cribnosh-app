import { MealItemDetails } from '@/components/ui/MealItemDetails';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MealDetailsDemoScreen() {
  const [showMealDetails, setShowMealDetails] = useState(true);

  const sampleMealData = {
    title: 'Shawarma',
    description: "For other's its Just Shawarma from Stans Kitchen, but to you and your current diet? its the exact fit for today.",
    price: 1284,
    imageUrl: undefined, // Will use placeholder
    kitchenName: "Stans Kitchen's Burgers",
    kitchenAvatar: undefined, // Will use placeholder
    calories: 1284,
    fat: '18g',
    protein: '12g',
    carbs: '230g',
    dietCompatibility: 70,
    dietMessage: 'Would help with your weight gain',
    ingredients: [
      { name: 'Chicken breasts', quantity: '250 g' },
      { name: 'Unsalted butter', quantity: '1 tbsp' },
      { name: 'Sesame or vegetable oil', quantity: '2 tsp' },
      { name: 'Fresh ginger', quantity: '2 tsp' }
    ]
  };

  const handleBack = () => {
    setShowMealDetails(false);
    // In a real app, this would close the drawer/modal
    setTimeout(() => {
      router.back();
    }, 300);
  };

  const handleAddToCart = (mealId: string, quantity: number) => {
    console.log(`Added ${quantity} of meal ${mealId} to cart`);
    // Handle add to cart logic here
    alert(`Added ${quantity} Shawarma(s) to cart!`);
  };

  if (!showMealDetails) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.showButton}
          onPress={() => setShowMealDetails(true)}
        >
          <Text style={styles.showButtonText}>Show Meal Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <MealItemDetails
      mealId="shawarma-001"
      onBack={handleBack}
      mealData={sampleMealData}
      onAddToCart={handleAddToCart}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFFFA',
  },
  showButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  showButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 