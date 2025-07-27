import React from 'react';
import { StyleSheet, View } from 'react-native';

export const BurgerIcon = () => {
  return (
    <View style={styles.burgerContainer}>
      {/* Top bun */}
      <View style={styles.topBun} />
      
      {/* Lettuce */}
      <View style={styles.lettuce} />
      
      {/* Tomato */}
      <View style={styles.tomato} />
      
      {/* Cheese */}
      <View style={styles.cheese} />
      
      {/* Patty */}
      <View style={styles.patty} />
      
      {/* Onion */}
      <View style={styles.onion} />
      
      {/* Bottom bun */}
      <View style={styles.bottomBun} />
    </View>
  );
};

const styles = StyleSheet.create({
  burgerContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FEF3C7', // Light yellow background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topBun: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: 8,
    backgroundColor: '#F59E0B', // Amber color for bun
    borderRadius: 4,
  },
  lettuce: {
    position: 'absolute',
    top: 12,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#10B981', // Green color for lettuce
    borderRadius: 2,
  },
  tomato: {
    position: 'absolute',
    top: 17,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#EF4444', // Red color for tomato
    borderRadius: 2,
  },
  cheese: {
    position: 'absolute',
    top: 22,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: '#F59E0B', // Yellow color for cheese
    borderRadius: 2,
  },
  patty: {
    position: 'absolute',
    top: 28,
    left: 10,
    right: 10,
    height: 6,
    backgroundColor: '#92400E', // Brown color for patty
    borderRadius: 3,
  },
  onion: {
    position: 'absolute',
    top: 36,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: '#F3F4F6', // Light gray for onion
    borderRadius: 1,
  },
  bottomBun: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    right: 8,
    height: 8,
    backgroundColor: '#F59E0B', // Amber color for bun
    borderRadius: 4,
  },
}); 