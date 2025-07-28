import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartButton } from './CartButton';
import { ChefNotes } from './MealItemDetails/ChefNotes';
import { DietCompatibilityBar } from './MealItemDetails/DietCompatibilityBar';
import { KitchenInfo } from './MealItemDetails/KitchenInfo';
import { MealBadges } from './MealItemDetails/MealBadges';
import { MealDescription } from './MealItemDetails/MealDescription';
import { MealHeader } from './MealItemDetails/MealHeader';
import { MealImage } from './MealItemDetails/MealImage';
import { MealInfo } from './MealItemDetails/MealInfo';
import { MealIngredients } from './MealItemDetails/MealIngredients';
import { MealTitle } from './MealItemDetails/MealTitle';
import { NutritionalInfo } from './MealItemDetails/NutritionalInfo';
import { SimilarMeals } from './MealItemDetails/SimilarMeals';

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
      isAllergen?: boolean;
      allergenType?: string;
    }>;
    isVegetarian?: boolean;
    isSafeForYou?: boolean;
    // New fields for additional sections
    prepTime?: string;
    deliveryTime?: string;
    chefName?: string;
    chefStory?: string;
    chefTips?: string[];
    similarMeals?: Array<{
      id: string;
      name: string;
      price: string;
      imageUrl?: string;
      sentiment?: 'bussing' | 'mid' | 'notIt';
      isVegetarian?: boolean;
    }>;
  };
  onAddToCart?: (mealId: string, quantity: number) => void;
  onSimilarMealPress?: (mealId: string) => void;
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
      { name: 'Unsalted butter', quantity: '1 tbsp', isAllergen: true, allergenType: 'dairy' },
      { name: 'Sesame oil', quantity: '2 tsp', isAllergen: true, allergenType: 'nuts' },
      { name: 'Fresh ginger', quantity: '2 tsp' },
      { name: 'Wheat flour', quantity: '100 g', isAllergen: true, allergenType: 'gluten' }
    ],
    isVegetarian: true,
    isSafeForYou: true,
    // Default values for new sections
    prepTime: '15 min',
    deliveryTime: '30 min',
    chefName: 'Chef Stan',
    chefStory: 'This Shawarma recipe has been perfected over 20 years of cooking. It combines traditional Middle Eastern spices with modern cooking techniques to create a dish that\'s both authentic and accessible.',
    chefTips: [
      'Marinate the chicken overnight for maximum flavor',
      'Use fresh spices for the best aroma',
      'Don\'t overcook the chicken - it should be juicy',
      'Let the meat rest for 5 minutes before slicing'
    ],
    similarMeals: [
      {
        id: 'kebab-001',
        name: 'Chicken Kebab',
        price: '£12.99',
        sentiment: 'bussing',
        isVegetarian: false
      },
      {
        id: 'falafel-001',
        name: 'Falafel Wrap',
        price: '£9.99',
        sentiment: 'mid',
        isVegetarian: true
      },
      {
        id: 'hummus-001',
        name: 'Hummus Plate',
        price: '£8.99',
        sentiment: 'bussing',
        isVegetarian: true
      }
    ]
  },
  onAddToCart,
  onSimilarMealPress
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

          {/* Meal Info Component */}
          <MealInfo 
            prepTime={mealData.prepTime || '15 min'}
            deliveryTime={mealData.deliveryTime || '30 min'}
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

          {/* Chef Notes Component */}
          <ChefNotes 
            story={mealData.chefStory}
            tips={mealData.chefTips}
            chefName={mealData.chefName}
            chefAvatar={mealData.kitchenAvatar}
          />

          {/* Similar Meals Component */}
          <SimilarMeals 
            meals={mealData.similarMeals || []}
            onMealPress={onSimilarMealPress}
          />
        </ScrollView>
      </View>

      {/* Add to Cart Button Component - Floating above everything with proper safe area handling */}
      <CartButton 
        quantity={quantity}
        onPress={handleAddToCart}
        variant="view"
        position="absolute"
        bottom={Math.max(insets.bottom, 80)}
        left={20}
        right={20}
        buttonText="Add to Cart"
        showIcon={false}
      />
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