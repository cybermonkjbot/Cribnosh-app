import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MealDescriptionProps {
  description: string;
  foodCreatorName?: string;
  onFoodCreatorNamePress?: () => void;
}

export function MealDescription({ description, foodCreatorName, onFoodCreatorNamePress }: MealDescriptionProps) {
  // If no foodCreator name, just show the description as-is
  if (!foodCreatorName) {
    return (
      <View style={styles.container}>
        <Text style={styles.description}>{description}</Text>
      </View>
    );
  }

  // Split the description to highlight the foodCreator name
  const parts = description.split(foodCreatorName);
  
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        {parts[0]}
        {onFoodCreatorNamePress ? (
          <Text 
            style={styles.foodCreatorLink}
            onPress={onFoodCreatorNamePress}
          >
            {foodCreatorName}
          </Text>
        ) : (
          <Text style={styles.foodCreatorLink}>{foodCreatorName}</Text>
        )}
        {parts[1]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  description: {
    fontFamily: 'SF Pro',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
  },
  
  // FoodCreator name styled as a link (CribNosh orange-red)
  foodCreatorLink: {
    color: '#FF3B30', // CribNosh orange-red instead of iOS blue
    textDecorationLine: 'underline',
  },
}); 