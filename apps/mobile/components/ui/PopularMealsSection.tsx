import { useMeals } from '@/hooks/useMeals';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { showError } from '../../lib/GlobalToastManager';
import { PopularMealsSectionEmpty } from './PopularMealsSectionEmpty';
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

interface PopularMealsSectionProps {
  meals?: Meal[];
  onMealPress?: (meal: Meal) => void;
  onSeeAllPress?: () => void;
  title?: string;
  showTitle?: boolean;
  isLoading?: boolean;
  useBackend?: boolean;
  hasInitialLoadCompleted?: boolean;
  isFirstSection?: boolean;
}

export const PopularMealsSection: React.FC<PopularMealsSectionProps> = ({
  meals: propMeals,
  onMealPress,
  onSeeAllPress,
  title,
  showTitle = true,
  isLoading: propIsLoading,
  useBackend = true,
  hasInitialLoadCompleted = false,
  isFirstSection = false,
}) => {
  const { isAuthenticated, user } = useAuthContext();
  const { getRandomMeals, isLoading: isLoadingMeals } = useMeals();
  
  const [popularMealsData, setPopularMealsData] = useState<any>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<any>(null);

  // Load popular meals (using random meals for now, or we can use top-rated)
  useEffect(() => {
    if (useBackend && isAuthenticated) {
      const loadPopularMeals = async () => {
        try {
          setBackendLoading(true);
          setBackendError(null);
          // For now, use random meals as popular meals
          // In the future, we can add a specific getPopularMeals action
          const result = await getRandomMeals(20);
          if (result.success) {
            // Transform to match expected format
            setPopularMealsData({ 
              success: true, 
              data: { 
                popular: result.data.meals.map((meal: any) => ({
                  meal,
                  chef: meal.chef || null,
                }))
              } 
            });
          }
        } catch (error: any) {
          setBackendError(error);
        } finally {
          setBackendLoading(false);
        }
      };
      loadPopularMeals();
    } else {
      setPopularMealsData(null);
    }
  }, [useBackend, isAuthenticated, getRandomMeals]);

  // Transform API data to component format
  const transformMealData = useCallback((apiMeal: any): Meal | null => {
    if (!apiMeal?.meal) return null;

    const meal = apiMeal.meal;
    const chef = apiMeal.chef;

    return {
      id: meal._id || meal.id || '',
      name: meal.name || 'Unknown Meal',
      kitchen: chef?.kitchen_name || chef?.name || 'Unknown Kitchen',
      price: meal.price ? `£${(meal.price / 100).toFixed(2)}` : '£0.00',
      originalPrice: meal.original_price ? `£${(meal.original_price / 100).toFixed(2)}` : undefined,
      image: {
        uri: meal.image_url || meal.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      },
      isPopular: true, // These are popular meals by definition
      isNew: meal.is_new || false,
      sentiment: meal.sentiment || 'solid',
      deliveryTime: meal.delivery_time || '30 min',
    };
  }, []);

  // Process meals data
  const meals: Meal[] = useMemo(() => {
    // If propMeals provided (even if empty), use them (for filtered view)
    // This allows empty arrays to be respected when filtering
    if (propMeals !== undefined) {
      return propMeals;
    }

    // Otherwise, use backend data if available
    if (useBackend && popularMealsData?.success && popularMealsData.data?.popular) {
      const transformedMeals = popularMealsData.data.popular
        .map(transformMealData)
        .filter((meal): meal is Meal => meal !== null);
      return transformedMeals;
    }

    // Fallback to empty array
    return [];
  }, [propMeals, popularMealsData, useBackend, transformMealData]);

  // Determine loading state
  const isLoading = propIsLoading !== undefined ? propIsLoading : (useBackend && backendLoading);

  // Error state is shown in UI - no toast needed

  // Only show skeleton during initial load, never after initial load is complete
  if (isLoading && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={isLoading}>
        <PopularMealsSectionSkeleton itemCount={8} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no meals (don't show empty state)
  if (meals.length === 0) {
    return null;
  }
  const renderMealCard = (meal: Meal, index: number) => (
    <TouchableOpacity
      key={meal.id}
      style={{
        width: 140,
        marginRight: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
      }}
      onPress={() => onMealPress?.(meal)}
      activeOpacity={0.8}
    >
      {/* Meal Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={meal.image}
          style={{
            width: '100%',
            height: 120,
            resizeMode: 'cover',
          }}
        />
        
        {/* Popular Badge */}
        {meal.isPopular && (
          <View style={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: '#ef4444',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '600',
            }}>
              POPULAR
            </Text>
          </View>
        )}
        
        {/* New Badge */}
        {meal.isNew && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#00cc88',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}>
            <Text style={{
              color: '#ffffff',
              fontSize: 10,
              fontWeight: '600',
            }}>
              NEW
            </Text>
          </View>
        )}
      </View>
      
      {/* Meal Info */}
      <View style={{ padding: 12 }}>
        <Text style={{
          color: '#1a1a1a',
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 2,
          lineHeight: 16,
        }}>
          {meal.name}
        </Text>
        
        <Text style={{
          color: '#666666',
          fontSize: 11,
          fontWeight: '400',
          marginBottom: 6,
        }}>
          {meal.kitchen}
        </Text>
        
        {/* Sentiment and Delivery Time */}
        {meal.sentiment && meal.deliveryTime && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}>
            <SentimentRating sentiment={meal.sentiment} />
            <Text style={{
              color: '#666666',
              fontSize: 10,
              fontWeight: '500',
            }}>
              {meal.deliveryTime}
            </Text>
          </View>
        )}
        
        {/* Price */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
          <Text style={{
            color: '#1a1a1a',
            fontSize: 14,
            fontWeight: '700',
          }}>
            {meal.price}
          </Text>
          {meal.originalPrice && (
            <Text style={{
              color: '#999999',
              fontSize: 12,
              fontWeight: '400',
              textDecorationLine: 'line-through',
            }}>
              {meal.originalPrice}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Don't render section if meals array is empty
  if (meals.length === 0) {
    return null;
  }

  // Don't show "See All" button inside drawers - only on main screen
  const shouldShowSeeAll = showTitle && onSeeAllPress;

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
            {title || 'Popular Meals'}
          </Text>
          
          {shouldShowSeeAll && (
            <TouchableOpacity onPress={onSeeAllPress}>
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
          paddingLeft: 12, // Changed from paddingHorizontal to paddingLeft only
          gap: 12,
        }}
        style={{ marginBottom: 12 }}
      >
        {meals.slice(0, 4).map(renderMealCard)}
      </ScrollView>
      
      {/* Second Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 12, // Changed from paddingHorizontal to paddingLeft only
          gap: 12,
        }}
      >
        {meals.slice(4, 8).map(renderMealCard)}
      </ScrollView>
    </View>
  );
}; 