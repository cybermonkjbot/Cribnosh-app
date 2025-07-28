import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MealBadgesProps {
  isVegetarian?: boolean;
  isSafeForYou?: boolean;
}

export function MealBadges({ isVegetarian = true, isSafeForYou = true }: MealBadgesProps) {
  return (
    <View style={styles.badgesContainer}>
      {/* Vegetarian Badge - Red chip with leaf icon */}
      {isVegetarian && (
        <View style={styles.vegetarianBadge}>
          <Ionicons name="leaf-outline" size={16} color="#FFFFFF" />
          <Text style={styles.vegetarianText}>Vegetarian</Text>
        </View>
      )}
      
      {/* Safe for you Badge - Dark green chip with thumbs-up and star icons */}
      {isSafeForYou && (
        <View style={styles.safeForYouBadge}>
          <Ionicons name="thumbs-up-outline" size={14} color="#FFFFFF" />
          <Ionicons name="star-outline" size={14} color="#FFFFFF" style={styles.starIcon} />
          <Text style={styles.safeForYouText}>Safe for you</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
  
  // Vegetarian Badge (red background)
  vegetarianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30', // Red background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  
  vegetarianText: {
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // Safe for you Badge (dark green background)
  safeForYouBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#094327', // Dark green background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  
  starIcon: {
    marginLeft: 2,
  },
  
  safeForYouText: {
    fontFamily: 'SF Pro',
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
  },
}); 