import { EmotionType } from './EmotionsUIContext';

// Meal category interface
export interface MealCategory {
  id: string;
  label: string;
  emoji: string;
  description: string;
  suitableEmotions: EmotionType[];
  color: string;
  secondaryColor: string;
  tags: string[];
  examples: string[];
}

// Comprehensive meal categories with emotion mapping
export const MEAL_CATEGORIES: MealCategory[] = [
  {
    id: 'comfort-food',
    label: 'Comfort Food',
    emoji: '🍜',
    description: 'Warm, hearty dishes that feel like a hug',
    suitableEmotions: ['sad', 'tired', 'stressed', 'neutral'],
    color: '#8B5CF6',
    secondaryColor: '#A78BFA',
    tags: ['comfort', 'warm', 'hearty', 'cozy'],
    examples: ['Mac & Cheese', 'Chicken Soup', 'Mashed Potatoes', 'Grilled Cheese'],
  },
  {
    id: 'quick-bites',
    label: 'Quick Bites',
    emoji: '🥪',
    description: 'Fast, satisfying snacks and light meals',
    suitableEmotions: ['hungry', 'tired', 'stressed', 'neutral'],
    color: '#F59E0B',
    secondaryColor: '#FBBF24',
    tags: ['quick', 'snack', 'light', 'fast'],
    examples: ['Sandwich', 'Wrap', 'Salad', 'Smoothie Bowl'],
  },
  {
    id: 'indulgent-treats',
    label: 'Indulgent Treats',
    emoji: '🍰',
    description: 'Decadent desserts and sweet delights',
    suitableEmotions: ['sad', 'excited', 'neutral'],
    color: '#EC4899',
    secondaryColor: '#F472B6',
    tags: ['sweet', 'dessert', 'indulgent', 'treat'],
    examples: ['Chocolate Cake', 'Ice Cream', 'Brownies', 'Cheesecake'],
  },
  {
    id: 'energizing-meals',
    label: 'Energizing Meals',
    emoji: '⚡',
    description: 'Nutritious power foods to boost your energy',
    suitableEmotions: ['tired', 'stressed', 'neutral'],
    color: '#10B981',
    secondaryColor: '#34D399',
    tags: ['healthy', 'energizing', 'nutritious', 'power'],
    examples: ['Buddha Bowl', 'Quinoa Salad', 'Smoothie', 'Oatmeal'],
  },
  {
    id: 'spicy-adventures',
    label: 'Spicy Adventures',
    emoji: '🌶️',
    description: 'Bold, flavorful dishes with a kick',
    suitableEmotions: ['excited', 'hungry', 'neutral'],
    color: '#EF4444',
    secondaryColor: '#F87171',
    tags: ['spicy', 'bold', 'flavorful', 'adventure'],
    examples: ['Tacos', 'Curry', 'Hot Wings', 'Jerk Chicken'],
  },
  {
    id: 'cozy-beverages',
    label: 'Cozy Beverages',
    emoji: '☕',
    description: 'Warm drinks to soothe and comfort',
    suitableEmotions: ['sad', 'tired', 'stressed', 'neutral'],
    color: '#7C3AED',
    secondaryColor: '#A78BFA',
    tags: ['warm', 'cozy', 'beverage', 'soothing'],
    examples: ['Hot Chocolate', 'Tea', 'Coffee', 'Golden Milk'],
  },
  {
    id: 'fresh-crisp',
    label: 'Fresh & Crisp',
    emoji: '🥗',
    description: 'Light, refreshing dishes full of life',
    suitableEmotions: ['excited', 'neutral', 'stressed'],
    color: '#22C55E',
    secondaryColor: '#4ADE80',
    tags: ['fresh', 'crisp', 'light', 'refreshing'],
    examples: ['Caesar Salad', 'Sushi', 'Spring Rolls', 'Fruit Bowl'],
  },
  {
    id: 'hearty-classics',
    label: 'Hearty Classics',
    emoji: '🍖',
    description: 'Traditional favorites that never disappoint',
    suitableEmotions: ['hungry', 'sad', 'neutral'],
    color: '#DC2626',
    secondaryColor: '#EF4444',
    tags: ['classic', 'hearty', 'traditional', 'filling'],
    examples: ['Burger', 'Pizza', 'Steak', 'Pasta'],
  },
];

// Helper function to get meal categories by emotion
export function getMealCategoriesByEmotion(emotion: EmotionType): MealCategory[] {
  return MEAL_CATEGORIES.filter(category => 
    category.suitableEmotions.includes(emotion)
  );
}

// Helper function to get random meal category
export function getRandomMealCategory(): MealCategory {
  const randomIndex = Math.floor(Math.random() * MEAL_CATEGORIES.length);
  return MEAL_CATEGORIES[randomIndex];
}

// Helper function to get weighted meal category based on emotion
export function getWeightedMealCategory(emotion: EmotionType): MealCategory {
  const suitableCategories = getMealCategoriesByEmotion(emotion);
  
  if (suitableCategories.length === 0) {
    return getRandomMealCategory();
  }
  
  // 70% chance to get emotion-suitable category, 30% random
  const shouldUseSuitable = Math.random() < 0.7;
  
  if (shouldUseSuitable) {
    const randomIndex = Math.floor(Math.random() * suitableCategories.length);
    return suitableCategories[randomIndex];
  } else {
    return getRandomMealCategory();
  }
} 