import React from 'react';
import { StyleSheet, Text } from 'react-native';

interface MealDescriptionProps {
  description: string;
  kitchenName?: string;
}

export function MealDescription({ description, kitchenName = "Stans Kitchen" }: MealDescriptionProps) {
  // Split the description to highlight the kitchen name
  const parts = description.split(kitchenName);
  
  return (
    <Text style={styles.description}>
      {parts[0]}
      <Text style={styles.kitchenLink}>{kitchenName}</Text>
      {parts[1]}
    </Text>
  );
}

const styles = StyleSheet.create({
  description: {
    fontFamily: 'SF Pro',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
    marginHorizontal: 20,
    marginBottom: 25,
  },
  
  // Kitchen name styled as a link (CribNosh orange-red)
  kitchenLink: {
    color: '#FF3B30', // CribNosh orange-red instead of iOS blue
    textDecorationLine: 'underline',
  },
}); 