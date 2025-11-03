import { Image } from 'expo-image';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Cuisine {
  id: string;
  name: string;
  image: any;
  restaurantCount: number;
  isActive?: boolean;
}

interface CuisineCategoriesSectionProps {
  cuisines: Cuisine[];
  onCuisinePress?: (cuisine: Cuisine) => void;
  onSeeAllPress?: () => void;
}

export const CuisineCategoriesSection: React.FC<CuisineCategoriesSectionProps> = ({
  cuisines,
  onCuisinePress,
  onSeeAllPress
}) => {
  const renderCuisineCard = (cuisine: Cuisine, index: number) => (
    <TouchableOpacity
      key={cuisine.id}
      style={{
        width: '48%',
        aspectRatio: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: cuisine.isActive 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: cuisine.isActive 
          ? 'rgba(239, 68, 68, 0.3)' 
          : 'rgba(255, 255, 255, 0.15)',
        marginBottom: 12,
      }}
      onPress={() => onCuisinePress?.(cuisine)}
      activeOpacity={0.8}
    >
      {/* Cuisine Image */}
      <View style={{ 
        flex: 1,
        position: 'relative',
      }}>
        <Image
          source={cuisine.image}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
          }}
        />
        
        {/* Overlay */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        }} />
        
        {/* Content */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 12,
        }}>
          <Text style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '700',
            marginBottom: 4,
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {cuisine.name}
          </Text>
          
          <Text style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 12,
            fontWeight: '500',
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            {cuisine.restaurantCount} Kitchens
          </Text>
        </View>
        
        {/* Active Indicator */}
        {cuisine.isActive && (
          <View style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: '#ef4444',
            width: 8,
            height: 8,
            borderRadius: 4,
          }} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Don't render section if cuisines array is empty
  if (cuisines.length === 0) {
    return null;
  }

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
          Cuisine Categories
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
      
      {/* Grid Layout */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
      }}>
        {cuisines.map(renderCuisineCard)}
      </View>
    </View>
  );
}; 