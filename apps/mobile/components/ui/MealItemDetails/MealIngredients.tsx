import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Ingredient {
  name: string;
  quantity: string;
  isAllergen?: boolean;
  allergenType?: string; // e.g., 'nuts', 'dairy', 'gluten'
}

interface MealIngredientsProps {
  ingredients: Ingredient[];
}

export function MealIngredients({ ingredients }: MealIngredientsProps) {
  const getChipStyle = (isAllergen: boolean = false) => {
    return isAllergen ? styles.allergenChip : styles.ingredientChip;
  };

  const getChipTextStyle = (isAllergen: boolean = false) => {
    return isAllergen ? styles.allergenChipText : styles.ingredientChipText;
  };

  const getIconName = (allergenType?: string) => {
    switch (allergenType) {
      case 'nuts': return 'warning';
      case 'dairy': return 'alert-circle';
      case 'gluten': return 'close-circle';
      default: return 'warning';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ingredients</Text>
      
      <View style={styles.chipsContainer}>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={getChipStyle(ingredient.isAllergen)}>
            {ingredient.isAllergen && (
              <Ionicons 
                name={getIconName(ingredient.allergenType)} 
                size={14} 
                color="#FF3B30" 
                style={styles.allergenIcon}
              />
            )}
            <Text style={getChipTextStyle(ingredient.isAllergen)}>
              {ingredient.name} • {ingredient.quantity}
            </Text>
          </View>
        ))}
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  ingredientChipText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  allergenChipText: {
    fontSize: 14,
    color: '#DC3545',
    fontWeight: '600',
  },
  allergenIcon: {
    marginRight: 6,
  },
}); 