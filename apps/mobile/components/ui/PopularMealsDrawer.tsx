import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { PopularMealsSection } from './PopularMealsSection';

interface Meal {
  id: string;
  name: string;
  kitchen: string;
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
  // Enhanced default meals with more realistic data
  const defaultMeals: Meal[] = [
    {
      id: '1',
      name: 'Jollof Rice',
      kitchen: 'Amara\'s Kitchen',
      price: '£12',
      originalPrice: '£15',
      image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
      isPopular: true,
      sentiment: 'elite',
      deliveryTime: '25 min',
    },
    {
      id: '2',
      name: 'Green Curry',
      kitchen: 'Bangkok Bites',
      price: '£14',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isNew: true,
      sentiment: 'fire',
      deliveryTime: '30 min',
    },
    {
      id: '3',
      name: 'Lamb Tagine',
      kitchen: 'Marrakech Delights',
      price: '£18',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isPopular: true,
      sentiment: 'slaps',
      deliveryTime: '35 min',
    },
    {
      id: '4',
      name: 'Bulgogi Bowl',
      kitchen: 'Seoul Street',
      price: '£16',
      image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
      sentiment: 'solid',
      deliveryTime: '28 min',
    },
    {
      id: '5',
      name: 'Truffle Risotto',
      kitchen: 'Nonna\'s Table',
      price: '£22',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isPopular: true,
      sentiment: 'bussing',
      deliveryTime: '32 min',
    },
    {
      id: '6',
      name: 'Sushi Platter',
      kitchen: 'Tokyo Dreams',
      price: '£25',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isNew: true,
      sentiment: 'decent',
      deliveryTime: '22 min',
    },
    {
      id: '7',
      name: 'Pounded Yam',
      kitchen: 'Amara\'s Kitchen',
      price: '£10',
      image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
      sentiment: 'average',
      deliveryTime: '25 min',
    },
    {
      id: '8',
      name: 'Pad Thai',
      kitchen: 'Bangkok Bites',
      price: '£13',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      sentiment: 'mid',
      deliveryTime: '30 min',
    },
    {
      id: '9',
      name: 'Butter Chicken',
      kitchen: 'Mumbai Spice',
      price: '£15',
      image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
      isPopular: true,
      sentiment: 'meh',
      deliveryTime: '40 min',
    },
    {
      id: '10',
      name: 'Coq au Vin',
      kitchen: 'Parisian Bistro',
      price: '£20',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      sentiment: 'notIt',
      deliveryTime: '45 min',
    },
    {
      id: '11',
      name: 'Pho Noodle Soup',
      kitchen: 'Saigon Street',
      price: '£11',
      image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
      isNew: true,
      sentiment: 'trash',
      deliveryTime: '35 min',
    },
    {
      id: '12',
      name: 'Paella Valenciana',
      kitchen: 'Barcelona Tapas',
      price: '£19',
      image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
      isPopular: true,
      sentiment: 'skip',
      deliveryTime: '50 min',
    },
  ];

  const displayMeals = meals.length > 0 ? meals : defaultMeals;

  // Enhanced filter chips for meal categories
  const filterChips = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'trending', label: 'Trending', icon: 'flame' },
    { id: 'new', label: 'New', icon: 'sparkles' },
    { id: 'elite', label: 'Elite', icon: 'star' },
    { id: 'quick', label: 'Quick', icon: 'flash' },
    { id: 'budget', label: 'Budget', icon: 'wallet' },
  ];

  const trendingMeals = displayMeals.filter(meal => meal.isPopular);
  const newMeals = displayMeals.filter(meal => meal.isNew);
  const eliteMeals = displayMeals.filter(meal => 
    ['elite', 'bussing', 'fire', 'slaps'].includes(meal.sentiment || '')
  );
  const quickMeals = displayMeals.filter(meal => {
    if (!meal.deliveryTime) return false;
    const deliveryTime = parseInt(meal.deliveryTime.split(' ')[0]);
    return deliveryTime <= 30;
  });
  const budgetMeals = displayMeals.filter(meal => {
    const price = parseInt(meal.price.replace('£', ''));
    return price <= 15;
  });

  return (
    <CategoryFullDrawer
      categoryName="Popular Meals"
      categoryDescription="Discover the most loved dishes from our community of food enthusiasts"
      onBack={onBack}
      filterChips={filterChips}
      activeFilters={[]}
      searchPlaceholder="Search meals by name or kitchen..."
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