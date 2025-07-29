import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackedProgressCards } from '../components/ui/StackedProgressCards';

export default function StackedProgressCardsDemo() {
  const [caloriesProgress, setCaloriesProgress] = useState(23);
  const [noshPointsProgress, setNoshPointsProgress] = useState(40);

  const updateProgress = () => {
    setCaloriesProgress(Math.floor(Math.random() * 100));
    setNoshPointsProgress(Math.floor(Math.random() * 100));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stacked Progress Cards Demo</Text>
        <Text style={styles.subtitle}>
          Two cards stacked on each other with progress indicators
        </Text>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Default Configuration</Text>
        <View style={styles.cardContainer}>
          <StackedProgressCards />
        </View>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Custom Progress Values</Text>
        <View style={styles.cardContainer}>
          <StackedProgressCards 
            caloriesProgress={caloriesProgress}
            noshPointsProgress={noshPointsProgress}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={updateProgress}>
          <Text style={styles.buttonText}>Randomize Progress</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>
          Calories: {caloriesProgress}% | Nosh Points: {noshPointsProgress}%
        </Text>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Custom Labels</Text>
        <View style={styles.cardContainer}>
          <StackedProgressCards 
            caloriesProgress={65}
            noshPointsProgress={78}
            caloriesLabel="Calories Burned"
            noshPointsLabel="Reward Points"
          />
        </View>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>High Progress Values</Text>
        <View style={styles.cardContainer}>
          <StackedProgressCards 
            caloriesProgress={95}
            noshPointsProgress={88}
            caloriesLabel="Daily Goal"
            noshPointsLabel="Achievement"
          />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Component Features:</Text>
        <Text style={styles.infoText}>• Two stacked cards with different backgrounds</Text>
        <Text style={styles.infoText}>• Gradient background for calories card</Text>
        <Text style={styles.infoText}>• Semi-transparent background for nosh points card</Text>
        <Text style={styles.infoText}>• Customizable progress bars with yellow fill</Text>
        <Text style={styles.infoText}>• Arrow icon on the top card</Text>
        <Text style={styles.infoText}>• Customizable labels and progress values</Text>
        <Text style={styles.infoText}>• Absolute positioning as per design specs</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E6FFE8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 22,
  },
  demoSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 15,
  },
  cardContainer: {
    height: 200,
    marginBottom: 15,
    position: 'relative',
  },
  button: {
    backgroundColor: '#EBA10F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
  progressText: {
    textAlign: 'center',
    color: '#cccccc',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: 'rgba(9, 67, 39, 0.2)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
    lineHeight: 20,
  },
}); 