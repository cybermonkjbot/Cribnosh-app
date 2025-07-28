import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    AddToCartButton,
    DietCompatibilityBar,
    KitchenInfo,
    MealBadges,
    MealDescription,
    MealHeader,
    MealImage,
    MealIngredients,
    MealTitle,
    NutritionalInfo
} from './MealItemDetails/index';

interface MealItemDetailsProps {
  mealId: string;
  onBack: () => void;
  mealData?: {
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    kitchenName: string;
    kitchenAvatar?: string;
    calories: number;
    fat: string;
    protein: string;
    carbs: string;
    dietCompatibility: number; // percentage
    dietMessage: string;
    ingredients: Array<{
      name: string;
      quantity: string;
    }>;
    isVegetarian?: boolean;
    isSafeForYou?: boolean;
  };
  onAddToCart?: (mealId: string, quantity: number) => void;
}

export function MealItemDetails({
  mealId,
  onBack,
  mealData = {
    title: 'Shawarma',
    description: "For other's its Just Shawarma from Stans Kitchen, but to you and your current diet? its the exact fit for today.",
    price: 1284,
    imageUrl: undefined,
    kitchenName: "Stans Kitchen's Burgers",
    kitchenAvatar: undefined,
    calories: 1284,
    fat: '18g',
    protein: '230g',
    carbs: '12g',
    dietCompatibility: 70,
    dietMessage: 'Would help with your weight gain',
    ingredients: [
      { name: 'Chicken breasts', quantity: '250 g' },
      { name: 'Unsalted butter', quantity: '1 tbsp' },
      { name: 'Sesame or vegetable oil', quantity: '2 tsp' },
      { name: 'Fresh ginger', quantity: '2 tsp' }
    ],
    isVegetarian: true,
    isSafeForYou: true,
  },
  onAddToCart
}: MealItemDetailsProps) {
  const [quantity, setQuantity] = useState(2);
  const [isFavorite, setIsFavorite] = useState(false);
  const insets = useSafeAreaInsets();

  const handleAddToCart = () => {
    onAddToCart?.(mealId, quantity);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Container with rounded top corners */}
      <View style={styles.mainContainer}>
        
        {/* Header Component */}
        <MealHeader 
          onBack={onBack} 
          onFavorite={handleFavorite}
          isFavorite={isFavorite}
        />

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 + Math.max(insets.bottom, 20) }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Kitchen Info Component - positioned at top */}
          <KitchenInfo 
            kitchenName={mealData.kitchenName}
            kitchenAvatar={mealData.kitchenAvatar}
          />

          {/* Meal Image Component */}
          <MealImage 
            imageUrl={mealData.imageUrl}
            title={mealData.title}
          />

          {/* Meal Title Component */}
          <MealTitle title={mealData.title} />

          {/* Meal Badges Component - chips under the title */}
          <MealBadges 
            isVegetarian={mealData.isVegetarian}
            isSafeForYou={mealData.isSafeForYou}
          />

          {/* Meal Description Component */}
          <MealDescription 
            description={mealData.description}
            kitchenName={mealData.kitchenName}
          />

          {/* Diet Compatibility Bar Component */}
          <DietCompatibilityBar compatibility={mealData.dietCompatibility} />

          {/* Nutritional Info Component */}
          <NutritionalInfo 
            calories={mealData.calories}
            fat={mealData.fat}
            protein={mealData.protein}
            carbs={mealData.carbs}
            dietMessage={mealData.dietMessage}
          />

          {/* Ingredients Component */}
          <MealIngredients ingredients={mealData.ingredients} />
        </ScrollView>

        {/* Add to Cart Button Component - Floating */}
        <AddToCartButton 
          quantity={quantity}
          onAddToCart={handleAddToCart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
}); 