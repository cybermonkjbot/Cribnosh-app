import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useCategoryDrawerSearch } from '@/hooks/useCategoryDrawerSearch';
import { CategoryFoodItemsGrid } from './CategoryFoodItemsGrid';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { useSearchQuery } from '@/store/customerApi';
import { useAuthContext } from '@/contexts/AuthContext';

interface CuisineCategoryDrawerProps {
  cuisine: {
    id: string;
    name: string;
    image?: any;
    restaurantCount?: number;
  };
  onBack: () => void;
  onAddToCart?: (id: string) => void;
  onItemPress?: (id: string) => void;
}

export function CuisineCategoryDrawer({
  cuisine,
  onBack,
  onAddToCart,
  onItemPress
}: CuisineCategoryDrawerProps) {
  const { isAuthenticated } = useAuthContext();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Fetch meals filtered by cuisine using search API
  const {
    data: cuisineMealsData,
    isLoading: isLoadingMeals,
    error: mealsError,
  } = useSearchQuery(
    { 
      query: '',
      type: 'dishes',
      limit: 50,
      page: 1,
      filters: {
        cuisine: [cuisine.name],
      },
    },
    {
      skip: !isAuthenticated,
    }
  );

  // Transform API data to FoodItem format
  const transformMealData = (apiMeal: any) => {
    if (!apiMeal) return null;

    const item = apiMeal.dish || apiMeal.meal || apiMeal;
    
    return {
      id: item._id || item.id || '',
      title: item.name || 'Unknown Item',
      description: item.description || '',
      price: typeof item.price === 'number' ? item.price / 100 : parseFloat(item.price || '0'),
      imageUrl: item.image_url || item.image || item.images?.[0],
      sentiment: item.sentiment || (item.rating >= 4.5 ? 'bussing' : 'mid'),
      prepTime: item.delivery_time || item.deliveryTime || '30 min',
      isPopular: item.is_popular || item.rating >= 4.5,
      isSpicy: item.dietary?.includes('Spicy') || false,
      isQuick: (item.delivery_time || item.deliveryTime || '30 min').includes('15') || false,
      isHealthy: item.dietary?.some((d: string) => ['Vegetarian', 'Vegan', 'Gluten-free'].includes(d)) || false,
      isVegan: item.dietary?.includes('Vegan') || false,
    };
  };

  // Process meals data
  const allMeals = useMemo(() => {
    if (cuisineMealsData?.success && cuisineMealsData.data) {
      const items = Array.isArray(cuisineMealsData.data) ? cuisineMealsData.data : [];
      return items
        .map(transformMealData)
        .filter((item): item is NonNullable<typeof item> => item !== null);
    }
    return [];
  }, [cuisineMealsData]);

  // Filter meals based on active filters
  const filterMealsByChips = useMemo(() => {
    if (activeFilters.length === 0) return allMeals;
    
    return allMeals.filter((meal) => {
      if (activeFilters.includes('popular') && !meal.isPopular) return false;
      if (activeFilters.includes('quick') && !meal.isQuick) return false;
      if (activeFilters.includes('healthy') && !meal.isHealthy) return false;
      if (activeFilters.includes('vegan') && !meal.isVegan) return false;
      if (activeFilters.includes('spicy') && !meal.isSpicy) return false;
      return true;
    });
  }, [allMeals, activeFilters]);

  // Search functionality with debouncing
  const { setSearchQuery, filteredItems: filteredMeals } = useCategoryDrawerSearch({
    items: filterMealsByChips,
    searchFields: ['title', 'description'],
  });

  // Popular meals (high rated)
  const popularMeals = useMemo(() => {
    return filteredMeals.filter(meal => meal.isPopular).slice(0, 10);
  }, [filteredMeals]);

  // Quick meals
  const quickMeals = useMemo(() => {
    return filteredMeals.filter(meal => meal.isQuick).slice(0, 10);
  }, [filteredMeals]);

  const handleFilterChange = (filterId: string) => {
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  const filterChips = [
    { id: 'popular', label: 'Popular', icon: 'flame' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'healthy', label: 'Healthy', icon: 'leaf' },
    { id: 'vegan', label: 'Vegan', icon: 'flower' },
    { id: 'spicy', label: 'Spicy', icon: 'flame' },
  ];

  return (
    <CategoryFullDrawer
      categoryName={cuisine.name}
      categoryDescription={`Explore ${cuisine.name} cuisine from the best local kitchens`}
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={activeFilters}
      onFilterChange={handleFilterChange}
      onSearch={setSearchQuery}
      searchPlaceholder={`Search ${cuisine.name} dishes...`}
      backButtonInSearchBar={true}
    >
      <View style={styles.content}>
        {isLoadingMeals ? (
          <View style={styles.loadingContainer}>
            {/* Loading skeleton could go here */}
          </View>
        ) : filteredMeals.length > 0 ? (
          <>
            {/* Popular Section */}
            {popularMeals.length > 0 && (
              <CategoryFoodItemsGrid
                title="Popular & Quick"
                subtitle="Most ordered dishes, ready in 15 minutes"
                items={popularMeals}
                onAddToCart={onAddToCart}
                onItemPress={onItemPress}
                showShadow={true}
                showSentiments={true}
                showPrepTime={true}
              />
            )}

            {/* Quick Meals Section */}
            {quickMeals.length > 0 && quickMeals.length !== popularMeals.length && (
              <CategoryFoodItemsGrid
                title="Quick Meals"
                subtitle="Fast delivery options"
                items={quickMeals}
                onAddToCart={onAddToCart}
                onItemPress={onItemPress}
                showSentiments={true}
                showPrepTime={true}
              />
            )}

            {/* All Available Section */}
            <CategoryFoodItemsGrid
              title="All Available"
              subtitle={`Complete ${cuisine.name} menu from local kitchens`}
              items={filteredMeals}
              onAddToCart={onAddToCart}
              onItemPress={onItemPress}
              showSentiments={true}
              showPrepTime={true}
            />
          </>
        ) : (
          <View style={styles.emptyContainer}>
            {/* Empty state could go here */}
          </View>
        )}
      </View>
    </CategoryFullDrawer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

