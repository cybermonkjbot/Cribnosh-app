import {
  CalorieCompareCard,
  CuisineScoreCard,
  MealsLoggedCard,
  WeeklySummaryCard
} from '@/components/ui';
import {
  generateMockWeeklyData,
  mockConvexQueries,
  sampleWeeklyData
} from '@/utils/braggingCardsData';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BraggingCardsDemo() {
  const [sampleData, setSampleData] = useState(sampleWeeklyData);
  const [isLoading, setIsLoading] = useState(false);

  const handleMealsPress = () => {
    Alert.alert('Meals Logged', 'Show detailed meals breakdown');
  };

  const handleCaloriesPress = () => {
    Alert.alert('Calories Tracked', 'Show detailed calorie analysis');
  };

  const handleCuisinePress = () => {
    Alert.alert('Cuisine Score', 'Show all cuisines explored');
  };

  const generateNewData = () => {
    setSampleData(generateMockWeeklyData());
  };

  const simulateConvexQuery = async () => {
    setIsLoading(true);
    try {
      const newData = await mockConvexQueries.getUserWeeklyStats('user_123');
      setSampleData(newData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Bragging Cards Demo</Text>
        <Text style={styles.subtitle}>Apple Health-style food stats</Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Generate New Data" 
            onPress={generateNewData}
            disabled={isLoading}
          />
          <Button 
            title="Simulate Convex Query" 
            onPress={simulateConvexQuery}
            disabled={isLoading}
          />
        </View>
      </View>

      {/* Individual Cards Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Individual Cards</Text>
        
        <MealsLoggedCard
          weekMeals={sampleData.weekMeals}
          avgMeals={sampleData.avgMeals}
          onPress={handleMealsPress}
        />
        
        <CalorieCompareCard
          kcalToday={sampleData.kcalToday}
          kcalYesterday={sampleData.kcalYesterday}
          onPress={handleCaloriesPress}
        />
        
        <CuisineScoreCard
          cuisines={sampleData.cuisines}
          onPress={handleCuisinePress}
        />
      </View>

      {/* Combined Weekly Summary Demo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Combined Weekly Summary</Text>
        <WeeklySummaryCard
          data={sampleData}
          onMealsPress={handleMealsPress}
          onCaloriesPress={handleCaloriesPress}
          onCuisinePress={handleCuisinePress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA1A6',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 8,
  },
}); 