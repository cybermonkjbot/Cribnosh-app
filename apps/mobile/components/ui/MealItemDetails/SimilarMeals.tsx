import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SentimentRating } from '../SentimentRating';
import { SimilarMealsSkeleton } from './Skeletons';

interface SimilarMeal {
  id: string;
  name: string;
  price: string;
  imageUrl?: string;
  sentiment?: 'bussing' | 'mid' | 'notIt';
  isVegetarian?: boolean;
}

interface SimilarMealsProps {
  meals?: SimilarMeal[];
  isLoading?: boolean;
  onMealPress?: (mealId: string) => void;
}

export function SimilarMeals({ meals, isLoading = false, onMealPress }: SimilarMealsProps) {
  if (isLoading) {
    return <SimilarMealsSkeleton />;
  }
  
  if (!meals || meals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>More from this Kitchen</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={styles.mealCard}
            onPress={() => onMealPress?.(meal.id)}
            activeOpacity={0.8}
          >
            {/* Meal Image */}
            <View style={styles.imageContainer}>
              <Image
                source={meal.imageUrl ? { uri: meal.imageUrl } : require('../../../assets/images/cribnoshpackaging.png')}
                style={styles.mealImage}
                resizeMode="cover"
              />
              {meal.isVegetarian && (
                <View style={styles.vegetarianBadge}>
                  <Ionicons name="leaf" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>

            {/* Meal Info */}
            <View style={styles.mealInfo}>
              <Text style={styles.mealName} numberOfLines={2}>
                {meal.name}
              </Text>
              
              <View style={styles.mealMeta}>
                {meal.sentiment && (
                  <SentimentRating sentiment={meal.sentiment} />
                )}
                <Text style={styles.priceText}>{meal.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  scrollContainer: {
    paddingRight: 20,
  },
  mealCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  vegetarianBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    padding: 12,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
    marginBottom: 8,
    lineHeight: 18,
  },
  mealMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
}); 