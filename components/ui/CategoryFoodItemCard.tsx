import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SentimentRating } from './SentimentRating';

interface CategoryFoodItemCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  sentiment?: 'bussing' | 'mid' | 'notIt';
  prepTime?: string;
  isPopular?: boolean;
  onAddToCart?: (id: string) => void;
  onPress?: (id: string) => void;
}

export function CategoryFoodItemCard({
  id,
  title,
  description,
  price,
  imageUrl,
  sentiment,
  prepTime,
  isPopular,
  onAddToCart,
  onPress
}: CategoryFoodItemCardProps) {
  const handleAddToCart = () => {
    onAddToCart?.(id);
  };

  const handlePress = () => {
    onPress?.(id);
  };

  return (
    <TouchableOpacity
      style={styles.container as any}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* Food Image */}
      <View style={styles.imageContainer as any}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image as any}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder as any}>
            <Ionicons name="restaurant" size={32} color="#9CA3AF" />
          </View>
        )}
        
        {/* Popular Badge */}
        {isPopular && (
          <View style={styles.popularBadge}>
            <Ionicons name="flame" size={12} color="#FFFFFF" />
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
        
        {/* Sentiment Badge */}
        {sentiment && (
          <SentimentRating sentiment={sentiment} />
        )}
      </View>

      {/* Food Details */}
      <View style={styles.detailsContainer as any}>
        <View style={styles.textContainer as any}>
          <Text style={styles.title as any} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.description as any} numberOfLines={2}>
            {description}
          </Text>
          
          {/* Prep Time */}
          {prepTime && (
            <View style={styles.prepTimeContainer}>
              <Ionicons name="time-outline" size={12} color="#6B7280" />
              <Text style={styles.prepTimeText}>{prepTime}</Text>
            </View>
          )}
        </View>

        {/* Price and Add Button */}
        <View style={styles.bottomRow as any}>
          <Text style={styles.price as any}>
            £ {price.toFixed(2)}
          </Text>
          <TouchableOpacity
            style={styles.addButton as any}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    height: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  } as const,
  imageContainer: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  } as const,
  image: {
    width: '100%',
    height: '100%',
  } as const,
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  popularBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  detailsContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  } as const,
  textContainer: {
    gap: 6,
  } as const,
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D0D0D',
    lineHeight: 20,
    letterSpacing: -0.02,
  } as const,
  description: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 16,
    letterSpacing: -0.01,
  } as const,
  prepTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  prepTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  } as const,
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
    lineHeight: 20,
    letterSpacing: -0.02,
  } as const,
  addButton: {
    width: 28,
    height: 28,
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  } as const,
}); 