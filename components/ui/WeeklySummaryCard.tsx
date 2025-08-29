import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalorieCompareCard } from './CalorieCompareCard';
import { CuisineScoreCard } from './CuisineScoreCard';
import { MealsLoggedCard } from './MealsLoggedCard';

interface WeeklySummaryData {
  weekMeals: number[];
  avgMeals: number;
  kcalToday: number;
  kcalYesterday: number;
  cuisines: string[];
}

interface WeeklySummaryCardProps {
  data: WeeklySummaryData;
  onMealsPress?: () => void;
  onCaloriesPress?: () => void;
  onCuisinePress?: () => void;
  variant?: 'standalone' | 'profile'; // New prop for different contexts
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  data = {
    weekMeals: [2, 3, 4, 3, 5, 1, 2],
    avgMeals: 2.9,
    kcalToday: 1420,
    kcalYesterday: 1680,
    cuisines: ['Nigerian', 'Italian', 'Asian Fusion', 'Mexican', 'Indian'],
  },
  onMealsPress,
  onCaloriesPress,
  onCuisinePress,
  variant = 'standalone',
}) => {
  const isProfileVariant = variant === 'profile';
  
  return (
    <View style={[
      styles.container, 
      isProfileVariant && styles.profileContainer
    ]}>
      {/* Header - only show in standalone mode */}
      {!isProfileVariant && (
        <View style={styles.header}>
          <Text style={styles.title}>Your Food Stats</Text>
          <Text style={styles.subtitle}>This week&apos;s highlights</Text>
        </View>
      )}

      {/* Cards */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isProfileVariant && styles.profileScrollContent
        ]}
      >
        <MealsLoggedCard
          weekMeals={data.weekMeals}
          avgMeals={data.avgMeals}
          onPress={onMealsPress}
        />
        
        <CalorieCompareCard
          kcalToday={data.kcalToday}
          kcalYesterday={data.kcalYesterday}
          onPress={onCaloriesPress}
        />
        
        <CuisineScoreCard
          cuisines={data.cuisines}
          onPress={onCuisinePress}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  profileContainer: {
    backgroundColor: 'transparent', // Transparent for profile context
    flex: undefined, // Don't take full height in profile
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileScrollContent: {
    paddingBottom: 0, // No extra padding in profile context
  },
}); 