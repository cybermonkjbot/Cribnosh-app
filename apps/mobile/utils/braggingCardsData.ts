export interface WeeklySummaryData {
  weekMeals: number[];
  avgMeals: number;
  kcalToday: number;
  kcalYesterday: number;
  cuisines: string[];
}

export interface MealLog {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  cuisine: string;
  foodCreatorName: string;
  createdAt: number;
}

// Mock data generator
export const generateMockWeeklyData = (): WeeklySummaryData => {
  // Generate random meal counts for the week (Monday to Sunday)
  const weekMeals = Array.from({ length: 7 }, () => Math.floor(Math.random() * 5) + 1);
  const avgMeals = weekMeals.reduce((sum, meals) => sum + meals, 0) / 7;
  
  // Generate calorie data
  const kcalToday = Math.floor(Math.random() * 800) + 1200; // 1200-2000 kcal
  const kcalYesterday = Math.floor(Math.random() * 800) + 1200;
  
  // Sample cuisines
  const allCuisines = [
    'Nigerian', 'Italian', 'Asian Fusion', 'Mexican', 'Indian', 
    'Thai', 'Chinese', 'Japanese', 'Korean', 'Mediterranean',
    'French', 'Spanish', 'Greek', 'Turkish', 'Lebanese',
    'Ethiopian', 'Moroccan', 'Vietnamese', 'Filipino', 'Caribbean'
  ];
  
  // Randomly select 3-6 cuisines
  const numCuisines = Math.floor(Math.random() * 4) + 3;
  const cuisines = allCuisines
    .sort(() => 0.5 - Math.random())
    .slice(0, numCuisines);

  return {
    weekMeals,
    avgMeals: Math.round(avgMeals * 10) / 10, // Round to 1 decimal
    kcalToday,
    kcalYesterday,
    cuisines,
  };
};

// Helper function to calculate average meals from meal logs
export const calculateAverageMeals = (mealLogs: MealLog[]): number => {
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const recentMeals = mealLogs.filter(meal => 
    new Date(meal.date) >= last7Days
  );
  
  if (recentMeals.length === 0) return 0;
  
  // Group by date and count meals per day
  const mealsByDate = recentMeals.reduce((acc, meal) => {
    const date = meal.date.split('T')[0]; // Get just the date part
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const totalMeals = Object.values(mealsByDate).reduce((sum, count) => sum + count, 0);
  const daysWithMeals = Object.keys(mealsByDate).length;
  
  return daysWithMeals > 0 ? Math.round((totalMeals / daysWithMeals) * 10) / 10 : 0;
};

// Helper function to get meals per day for the last 7 days
export const getWeekMeals = (mealLogs: MealLog[]): number[] => {
  const weekMeals = new Array(7).fill(0);
  const today = new Date();
  
  mealLogs.forEach(meal => {
    const mealDate = new Date(meal.date);
    const daysDiff = Math.floor((today.getTime() - mealDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 0 && daysDiff < 7) {
      weekMeals[daysDiff]++;
    }
  });
  
  return weekMeals.reverse(); // Most recent day first
};

// Helper function to get unique cuisines from meal logs
export const getUniqueCuisines = (mealLogs: MealLog[]): string[] => {
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const recentMeals = mealLogs.filter(meal => 
    new Date(meal.date) >= last7Days
  );
  
  const cuisines = recentMeals.map(meal => meal.cuisine);
  return [...new Set(cuisines)]; // Remove duplicates
};

// Helper function to calculate calories for specific days
export const getCaloriesForDay = (mealLogs: MealLog[], daysAgo: number): number => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  return mealLogs
    .filter(meal => meal.date.startsWith(targetDateStr))
    .reduce((sum, meal) => sum + meal.calories, 0);
};

export const mockConvexQueries = {
  // This would be replaced with actual backend API calls
  getUserWeeklyStats: async (userId: string): Promise<WeeklySummaryData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockWeeklyData();
  },
  
  getUserMealLogs: async (userId: string, days: number = 7): Promise<MealLog[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate mock meal logs
    const mockLogs: MealLog[] = [];
    const cuisines = ['Nigerian', 'Italian', 'Asian Fusion', 'Mexican', 'Indian'];
    const foodCreators = ['FoodCreator A', 'FoodCreator B', 'FoodCreator C', 'FoodCreator D'];
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString();
      
      // Generate 1-4 meals per day
      const mealsToday = Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < mealsToday; j++) {
        mockLogs.push({
          id: `meal_${i}_${j}`,
          userId,
          date: dateStr,
          mealType: mealTypes[Math.floor(Math.random() * mealTypes.length)],
          calories: Math.floor(Math.random() * 600) + 200,
          cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
          foodCreatorName: foodCreators[Math.floor(Math.random() * foodCreators.length)],
          createdAt: Date.now(),
        });
      }
    }
    
    return mockLogs;
  },
};

// Sample data for testing
export const sampleWeeklyData: WeeklySummaryData = {
  weekMeals: [2, 3, 4, 3, 5, 1, 2],
  avgMeals: 2.9,
  kcalToday: 1420,
  kcalYesterday: 1680,
  cuisines: ['Nigerian', 'Italian', 'Asian Fusion', 'Mexican', 'Indian', 'Thai'],
}; 