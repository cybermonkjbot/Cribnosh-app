import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CaloriesNoshPointsCards } from '../../components/ui/CaloriesNoshPointsCards';

export default function CaloriesNoshPointsDemo() {
  return (
    <View style={styles.container}>
      <CaloriesNoshPointsCards 
        caloriesProgress={23}
        noshPointsProgress={40}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark background to match the design
  },
}); 