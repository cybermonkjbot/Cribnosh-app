import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SentimentRating } from './SentimentRating';

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
  meals: Meal[];
  onMealPress?: (meal: Meal) => void;
  onSeeAllPress?: () => void;
}

export const PopularMealsSection: React.FC<PopularMealsSectionProps> = ({
  meals,
  onMealPress,
  onSeeAllPress
}) => {
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

  return (
    <View style={{ marginBottom: 24 }}>
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
          Popular Meals
        </Text>
        
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={{
            color: '#ef4444',
            fontSize: 14,
            fontWeight: '600',
          }}>
            See All
          </Text>
        </TouchableOpacity>
      </View>
      
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