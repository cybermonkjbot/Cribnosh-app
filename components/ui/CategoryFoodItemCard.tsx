import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CategoryFoodItemCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  onAddToCart?: (id: string) => void;
  onPress?: (id: string) => void;
}

export function CategoryFoodItemCard({
  id,
  title,
  description,
  price,
  imageUrl,
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
    width: 131,
    height: 233,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as const,
  imageContainer: {
    width: '100%',
    height: 131,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
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
  detailsContainer: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  } as const,
  textContainer: {
    gap: 4,
  } as const,
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0D0D0D',
    lineHeight: 21,
    letterSpacing: -0.03,
  } as const,
  description: {
    fontSize: 12,
    fontWeight: '400',
    color: '#3B3B3B',
    lineHeight: 14,
    letterSpacing: -0.03,
    opacity: 0.5,
  } as const,
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  } as const,
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF0000',
    lineHeight: 18,
    letterSpacing: -0.03,
  } as const,
  addButton: {
    width: 24,
    height: 24,
    backgroundColor: '#FF0000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
}); 