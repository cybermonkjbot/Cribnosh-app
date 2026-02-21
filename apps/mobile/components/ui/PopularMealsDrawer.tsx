import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { PopularMealsSection } from './PopularMealsSection';

interface Meal {
  id: string;
  name: string;
  foodCreator: string;
  price: string;
  originalPrice?: string;
  image: any;
  isPopular?: boolean;
  isNew?: boolean;
  sentiment?: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime?: string;
}

interface PopularMealsDrawerProps {
  onBack: () => void;
  meals?: Meal[];
  onMealPress?: (meal: Meal) => void;
}

export function PopularMealsDrawer({
  onBack,
  meals = [],
  onMealPress
}: PopularMealsDrawerProps) {
  // Use meals from props (which come from API in MainScreen)
  // Return empty array if no meals provided instead of mock data
  const baseMeals = meals.length > 0 ? meals : [];

  // Search functionality with debouncing
  const { setSearchQuery, filteredItems: displayMeals } = useCategoryDrawerSearch({
    items: baseMeals,
    searchFields: ['name', 'foodCreator'],
  });

  // Enhanced filter chips for meal categories
  const filterChips = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'trending', label: 'Trending', icon: 'flame' },
    { id: 'new', label: 'New', icon: 'sparkles' },
    { id: 'elite', label: 'Elite', icon: 'star' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'budget', label: 'Budget', icon: 'wallet' },
  ];

  return (
    <CategoryFullDrawer
      categoryName="Popular Meals"
      categoryDescription="Discover the most loved dishes from our community of food enthusiasts"
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={[]}
      onSearch={setSearchQuery}
      searchPlaceholder="Search meals by name or foodCreator..."
      backButtonInSearchBar={true}
    >
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <PopularMealsSection
            meals={displayMeals}
            onMealPress={onMealPress}
            showTitle={false}
            onSeeAllPress={undefined}
          />
        </ScrollView>
      </View>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
}); 