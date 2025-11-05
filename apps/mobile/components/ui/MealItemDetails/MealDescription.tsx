import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MealDescriptionProps {
  description: string;
  kitchenName?: string;
  onKitchenNamePress?: () => void;
}

export function MealDescription({ description, kitchenName = "Stans Kitchen", onKitchenNamePress }: MealDescriptionProps) {
  // Split the description to highlight the kitchen name
  const parts = description.split(kitchenName);
  
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        {parts[0]}
        {onKitchenNamePress ? (
          <Text 
            style={styles.kitchenLink}
            onPress={onKitchenNamePress}
          >
            {kitchenName}
          </Text>
        ) : (
          <Text style={styles.kitchenLink}>{kitchenName}</Text>
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
  
  // Kitchen name styled as a link (CribNosh orange-red)
  kitchenLink: {
    color: '#FF3B30', // CribNosh orange-red instead of iOS blue
    textDecorationLine: 'underline',
  },
}); 