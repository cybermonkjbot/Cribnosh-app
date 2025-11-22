import { useMeals } from '@/hooks/useMeals';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { PopularMealsSectionSkeleton } from './PopularMealsSectionSkeleton';
import { SentimentRating } from './SentimentRating';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

interface Meal {
  id: string;
  name: string;
  kitchen: string;
  price: string;
  originalPrice?: string;
  image: any;
  isPopular?: boolean;
  isNew?: boolean;
  sentiment?: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime?: string;
}

interface RecommendedMealsSectionProps {
  onMealPress?: (meal: Meal) => void;
  onSeeAllPress?: () => void;
  title?: string;
  showTitle?: boolean;
  limit?: number;
  hasInitialLoadCompleted?: boolean;
  isFirstSection?: boolean;
}

const RecommendedMealsSectionComponent: React.FC<RecommendedMealsSectionProps> = ({
  onMealPress,
  onSeeAllPress,
  title = 'Recommended For You',
  showTitle = true,
  limit = 8,
  hasInitialLoadCompleted = false,
  isFirstSection = false,
}) => {
  const { isAuthenticated, user } = useAuthContext();
  const { getRecommendedMeals, isLoading: isLoadingMeals } = useMeals();
  const locationState = useUserLocation();
  
  const [recommendationsData, setRecommendationsData] = useState<any>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<any>(null);

  // Load recommended meals
  useEffect(() => {
    if (isAuthenticated) {
      const loadRecommendations = async () => {
        try {
          setIsLoadingRecommendations(true);
          setRecommendationsError(null);
          const result = await getRecommendedMeals(limit, locationState.location || null);
          if (result.success) {
            setRecommendationsData({ success: true, data: { recommendations: result.data.meals } });
          }
        } catch (error: any) {
          setRecommendationsError(error);
        } finally {
          setIsLoadingRecommendations(false);
        }
      };
      loadRecommendations();
    } else {
      setRecommendationsData(null);
    }
  }, [isAuthenticated, limit, getRecommendedMeals, locationState.location]);

  // Transform API data to component format
  const transformMealData = useCallback((apiMeal: any): Meal | null => {
    if (!apiMeal) return null;

    const meal = apiMeal;
    const chef = meal.chef;

    return {
      id: meal._id || meal.id || '',
      name: meal.name || 'Unknown Meal',
      kitchen: chef?.name || chef?.kitchen_name || 'Unknown Kitchen',
      price: meal.price ? `£${(typeof meal.price === 'number' ? meal.price / 100 : parseFloat(meal.price)).toFixed(2)}` : '£0.00',
      originalPrice: meal.original_price ? `£${(typeof meal.original_price === 'number' ? meal.original_price / 100 : parseFloat(meal.original_price)).toFixed(2)}` : undefined,
      image: {
        uri: meal.images?.[0] || meal.image_url || meal.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      },
      isPopular: true,
      isNew: meal.is_new || false,
      sentiment: meal.sentiment || 'solid',
      deliveryTime: meal.deliveryTime || meal.delivery_time || null, // Use backend-calculated delivery time
    };
  }, []);

  // Process recommendations data
  const meals: Meal[] = useMemo(() => {
    if (recommendationsData?.success && recommendationsData.data?.recommendations) {
      const transformedMeals = recommendationsData.data.recommendations
        .map(transformMealData)
        .filter((meal): meal is Meal => meal !== null);
      return transformedMeals;
    }
    return [];
  }, [recommendationsData, transformMealData]);

  // Error state is shown in UI - no toast needed

  // Don't show section if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Only show skeleton during initial load, never after initial load is complete
  if (isLoadingRecommendations && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={isLoadingRecommendations}>
        <PopularMealsSectionSkeleton itemCount={8} />
      </SkeletonWithTimeout>
    );
  }

  // Show empty state if no recommendations
  if (meals.length === 0) {
    return null; // Don't show empty section for recommendations
  }

  const renderMealCard = (meal: Meal, index: number) => (
    <TouchableOpacity
      key={meal.id || index}
      onPress={() => onMealPress?.(meal)}
      style={{
        width: 160,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
      activeOpacity={0.8}
    >
      {/* Meal Image */}
      <View style={{ position: 'relative', width: '100%', height: 120 }}>
        <Image
          source={meal.image}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        {meal.isNew && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: '#10B981',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>NEW</Text>
          </View>
        )}
        {meal.sentiment && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}>
            <SentimentRating sentiment={meal.sentiment} />
          </View>
        )}
      </View>

      {/* Meal Info */}
      <View style={{ padding: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#1a1a1a',
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {meal.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
          }}
          numberOfLines={1}
        >
          {meal.kitchen}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {meal.originalPrice && (
              <Text style={{
                fontSize: 12,
                color: '#999',
                textDecorationLine: 'line-through',
              }}>
                {meal.originalPrice}
              </Text>
            )}
            <Text style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#ef4444',
            }}>
              {meal.price}
            </Text>
          </View>
          {meal.deliveryTime && (
            <Text style={{
              fontSize: 10,
              color: '#999',
            }}>
              {meal.deliveryTime}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const shouldShowSeeAll = showTitle && onSeeAllPress && meals.length > 8;

  return (
    <View style={{ marginBottom: 24, paddingTop: isFirstSection ? 15 : 0 }}>
      {showTitle && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          paddingHorizontal: 12,
        }}>
          <Text style={{
            color: '#1a1a1a',
            fontSize: 20,
            fontWeight: '700',
            lineHeight: 24,
          }}>
            {title}
          </Text>
          
          {shouldShowSeeAll && (
            <TouchableOpacity onPress={onSeeAllPress} hitSlop={12}>
              <Text style={{
                color: '#ef4444',
                fontSize: 14,
                fontWeight: '600',
              }}>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* First Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 12,
          gap: 12,
        }}
        style={{ marginBottom: 12 }}
      >
        {meals.slice(0, 4).map(renderMealCard)}
      </ScrollView>
      
      {/* Second Row */}
      {meals.length > 4 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 12,
            gap: 12,
          }}
        >
          {meals.slice(4, 8).map(renderMealCard)}
        </ScrollView>
      )}
    </View>
  );
};

export const RecommendedMealsSection = React.memo(RecommendedMealsSectionComponent);
