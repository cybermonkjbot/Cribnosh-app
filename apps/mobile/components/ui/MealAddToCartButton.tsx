import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

interface MealAddToCartButtonProps {
  mealId: string;
  onAddToCart: (mealId: string) => void;
  isLoading?: boolean;
}

export function MealAddToCartButton({
  mealId,
  onAddToCart,
  isLoading = false,
}: MealAddToCartButtonProps) {
  const handlePress = (e: any) => {
    e.stopPropagation();
    if (!isLoading) {
      onAddToCart(mealId);
    }
  };

  return (
    <TouchableOpacity
      style={styles.addButton}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Ionicons name="add" size={16} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
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
    zIndex: 10,
  },
});

