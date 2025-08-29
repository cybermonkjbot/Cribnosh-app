import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaloriesNoshPointsCards } from './ui/CaloriesNoshPointsCards';

const CaloriesNoshPointsExample: React.FC = () => {
  const [caloriesProgress, setCaloriesProgress] = useState(23);
  const [noshPointsProgress, setNoshPointsProgress] = useState(40);

  const updateProgress = () => {
    setCaloriesProgress(Math.floor(Math.random() * 100));
    setNoshPointsProgress(Math.floor(Math.random() * 100));
  };

  return (
    <View style={styles.container}>
      {/* Demo Controls */}
      <View style={styles.controls}>
        <Text style={styles.title}>Calories & Nosh Points Cards Demo</Text>
        <Pressable style={styles.button} onPress={updateProgress}>
          <Text style={styles.buttonText}>Update Progress</Text>
        </Pressable>
        <Text style={styles.info}>
          Calories: {caloriesProgress}% | Nosh Points: {noshPointsProgress}%
        </Text>
      </View>

      {/* Cards Component */}
      <CaloriesNoshPointsCards 
        caloriesProgress={caloriesProgress}
        noshPointsProgress={noshPointsProgress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  controls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
    alignItems: 'center',
  },
  title: {
    color: '#E6FFE8',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#EBA10F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    color: '#E6FFE8',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CaloriesNoshPointsExample; 