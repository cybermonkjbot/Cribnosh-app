import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddToCartButtonProps {
  quantity: number;
  onAddToCart: () => void;
}

export function AddToCartButton({ quantity, onAddToCart }: AddToCartButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 80) }]}>
      <TouchableOpacity style={styles.button} onPress={onAddToCart}>
        {/* Quantity Badge */}
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{quantity}</Text>
        </View>
        
        {/* Add to Cart Text */}
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 15,
    // Add shadow for floating effect
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  
  button: {
    position: 'relative',
    width: 325,
    height: 58,
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  quantityBadge: {
    position: 'absolute',
    width: 32,
    height: 32,
    left: 16, // Positioned from left edge of button
    backgroundColor: '#E6FFE8',
    borderRadius: 16, // 150px equivalent for 32px height
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  quantityText: {
    fontFamily: Platform.select({
      ios: 'Poppins-Bold, Arial Black, Arial',
      android: 'Poppins-Bold, Arial Black, Arial',
      default: 'Arial Black, Arial'
    }),
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    color: '#FF3B30',
  },
  
  buttonText: {
    fontFamily: Platform.select({
      ios: 'Poppins-SemiBold, Arial, sans-serif',
      android: 'Poppins-SemiBold, Arial, sans-serif',
      default: 'Arial, sans-serif'
    }),
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    color: '#E6FFE8',
  },
}); 