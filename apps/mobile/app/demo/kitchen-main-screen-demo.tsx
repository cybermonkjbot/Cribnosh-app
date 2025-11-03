import { KitchenMainScreen } from '@/components/ui/KitchenMainScreen';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function KitchenMainScreenDemo() {
  const handleCartPress = () => {
    Alert.alert('Cart', 'Cart button pressed!');
  };

  const handleHeartPress = () => {
    Alert.alert('Heart', 'Heart button pressed!');
  };

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search button pressed!');
  };

  // Removed unused handlePlayPress function

  return (
    <View style={styles.container}>
      <KitchenMainScreen
        kitchenName="Stans Kitchen"
        cuisine="African cuisine (Top Rated)"
        deliveryTime="30-45 Mins"
        cartItems={2}
        onCartPress={handleCartPress}
        onHeartPress={handleHeartPress}
        onSearchPress={handleSearchPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
}); 