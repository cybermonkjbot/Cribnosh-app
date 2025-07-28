import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MealIngredientsProps {
  ingredients: Array<{
    name: string;
    quantity: string;
  }>;
}

export function MealIngredients({ ingredients }: MealIngredientsProps) {
  console.log('MealIngredients - ingredients:', ingredients);
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ingredients</Text>
      
      <Text style={styles.debug}>Count: {ingredients?.length || 0}</Text>
      
      <View style={styles.table}>
        {ingredients && ingredients.length > 0 ? (
          ingredients.map((ingredient, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.name}>{ingredient.name}</Text>
              <Text style={styles.quantity}>{ingredient.quantity}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.debug}>No ingredients data</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#094327',
    marginBottom: 16,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  name: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  quantity: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 20,
  },
  debug: {
    fontSize: 12,
    color: '#FF0000',
    marginBottom: 8,
  },
}); 