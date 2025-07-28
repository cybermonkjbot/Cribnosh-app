import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

interface MealTitleProps {
  title: string;
}

export function MealTitle({ title }: MealTitleProps) {
  return (
    <View style={styles.container}>
      {/* CribNosh Logo - positioned above the title */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/livelogo.png')}
          style={styles.cribnoshLogo}
          resizeMode="contain"
        />
      </View>
      
      {/* Meal Title */}
      <Text style={styles.mealTitle} adjustsFontSizeToFit={true} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20, // Match the meal description alignment
    marginBottom: 25,
  },
  
  // Logo container
  logoContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  
  // CribNosh Logo
  cribnoshLogo: {
    width: 80,
    height: 20,
  },
  
  // Meal Title - adjusts size to fit
  mealTitle: {
    fontFamily: Platform.select({
      ios: 'Protest Strike, Arial Black, Arial',
      android: 'Protest Strike, Arial Black, Arial',
      default: 'Arial Black, Arial'
    }),
    fontWeight: '700',
    fontSize: 70, // Maximum font size
    lineHeight: 70,
    color: '#094327',
    textAlign: 'left',
    includeFontPadding: false,
    flexShrink: 1, // Allow text to shrink if needed
  },
}); 