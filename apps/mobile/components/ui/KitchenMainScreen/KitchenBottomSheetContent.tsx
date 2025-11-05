import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { AlertCircle, Search } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Rect, Svg } from 'react-native-svg';

import { useGetKitchenCategoriesQuery, useGetKitchenMealsQuery, useGetKitchenPopularMealsQuery, useGetKitchenTagsQuery, useSearchKitchenMealsQuery } from '@/store/customerApi';
import { CategoriesSkeleton, MealsSkeleton } from './KitchenSkeletons';

interface KitchenBottomSheetContentProps {
  isExpanded?: boolean;
  onScrollAttempt?: () => void;
  deliveryTime?: string;
  kitchenId?: string;
  searchQuery?: string;
}

const KitchenBottomSheetContent = forwardRef<ScrollView, KitchenBottomSheetContentProps>(({
  isExpanded = false,
  onScrollAttempt,
  deliveryTime = "30-45 mins",
  kitchenId,
  searchQuery,
}, ref) => {
  // State for selected category ID and active filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Fetch kitchen tags
  const { data: tagsDataRaw } = useGetKitchenTagsQuery(
    { kitchenId: kitchenId || '' },
    { skip: !kitchenId }
  );

  // Extract tags from response (handle both wrapped and unwrapped formats)
  const tagsData = (tagsDataRaw as any)?.data || tagsDataRaw;

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetKitchenCategoriesQuery(
    { kitchenId: kitchenId || '' },
    { skip: !kitchenId }
  );

  // Map real categories to display format (with icons)
  const categoryIcons: Record<string, React.ReactNode> = {
    'italian': (
      <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
        <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
        <Circle cx="17.5" cy="17.5" r="8" fill="#FFD700" />
      </Svg>
    ),
    'chinese': (
      <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
        <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
        <Circle cx="12" cy="12" r="3" fill="#4CAF50" />
        <Circle cx="23" cy="12" r="3" fill="#4CAF50" />
        <Circle cx="17.5" cy="17.5" r="3" fill="#4CAF50" />
      </Svg>
    ),
    // Add more icons as needed
  };

  const realCategories = (categoriesData as any)?.data?.categories || categoriesData?.categories || [];
  const categories = realCategories.map((cat: any) => ({
    id: cat.category.toLowerCase().replace(/\s+/g, '-'),
    name: cat.category,
    icon: categoryIcons[cat.category.toLowerCase()] || (
      <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
        <Rect x="2" y="2" width="31" height="31" rx="4" fill="#EAEAEA" stroke="#EAEAEA" strokeWidth="1" />
        <Circle cx="17.5" cy="17.5" r="8" fill="#FFD700" />
      </Svg>
    ),
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  }));

  // Get category name from selected category ID
  const selectedCategoryName = selectedCategoryId
    ? categories.find((cat: any) => cat.id === selectedCategoryId)?.name || null
    : null;

  // Fetch meals with filters
  const { data: filteredMealsData, isLoading: isLoadingFilteredMeals, isError: isErrorFilteredMeals } = useGetKitchenMealsQuery(
    {
      kitchenId: kitchenId || '',
      category: selectedCategoryName || undefined,
      dietary: activeFilters.size > 0 ? Array.from(activeFilters) : undefined,
      limit: 20,
    },
    { skip: !kitchenId || !selectedCategoryName && activeFilters.size === 0 }
  );

  // Fetch popular meals (when no filters/category selected)
  const { data: popularMealsData, isLoading: isLoadingPopularMeals, isError: isErrorPopularMeals } = useGetKitchenPopularMealsQuery(
    { kitchenId: kitchenId || '', limit: 10 },
    { skip: !kitchenId || selectedCategoryId !== null || activeFilters.size > 0 }
  );

  // Fetch search results if searchQuery is provided
  const { data: searchResults, isLoading: isLoadingSearch, isError: isErrorSearch } = useSearchKitchenMealsQuery(
    { kitchenId: kitchenId || '', q: searchQuery || '' },
    { skip: !kitchenId || !searchQuery || searchQuery.trim().length === 0 }
  );

  // Handle category selection
  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCategoryId === categoryId) {
      // Deselect if already selected
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(categoryId);
    }
  };

  // Handle filter chip toggle
  const handleFilterPress = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterId)) {
        newFilters.delete(filterId);
      } else {
        newFilters.add(filterId);
      }
      return newFilters;
    });
  };

  // Use real data only
  const realPopularMeals = (popularMealsData as any)?.data?.meals || popularMealsData?.meals || [];
  const filteredMeals = (filteredMealsData as any)?.data?.meals || filteredMealsData?.meals || [];
  const searchMeals = (searchResults as any)?.data?.meals || searchResults?.meals || [];

  // Map meals to display format
  const mapMealToDisplay = (meal: any) => ({
    id: meal._id || meal.id,
    name: meal.name || 'Unknown Meal',
    price: `£${meal.price?.toFixed(2) || '0.00'}`,
    originalPrice: meal.originalPrice ? `£${meal.originalPrice.toFixed(2)}` : undefined,
    image: meal.image ? { uri: meal.image } : require('../../../assets/images/cribnoshpackaging.png'),
    isPopular: meal.averageRating >= 4.5 || meal.reviewCount > 10,
    deliveryTime: `${meal.prepTime || 30} min`,
    averageRating: meal.averageRating,
    reviewCount: meal.reviewCount,
  });

  // Map popular meals to display format
  const popularMeals = realPopularMeals.map(mapMealToDisplay);

  // Determine which meals to display
  const displayMeals = searchQuery && searchQuery.trim().length > 0
    ? searchMeals.map(mapMealToDisplay)
    : selectedCategoryId !== null || activeFilters.size > 0
    ? filteredMeals.map(mapMealToDisplay)
    : popularMeals;

  const isLoadingMeals = searchQuery && searchQuery.trim().length > 0
    ? isLoadingSearch
    : selectedCategoryId !== null || activeFilters.size > 0
    ? isLoadingFilteredMeals
    : isLoadingPopularMeals;

  const isErrorMeals = searchQuery && searchQuery.trim().length > 0
    ? isErrorSearch
    : selectedCategoryId !== null || activeFilters.size > 0
    ? isErrorFilteredMeals
    : isErrorPopularMeals;

  return (
    <ScrollView 
      ref={ref}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      scrollEnabled={isExpanded}
      onScrollBeginDrag={() => {
        if (!isExpanded && onScrollAttempt) {
          onScrollAttempt();
        }
      }}
    >
      {/* Delivery information */}
      <Text style={styles.deliveryInfo}>
        Fresh from our kitchen to your door in {deliveryTime}
      </Text>

      {/* Feature chips - dynamically loaded from kitchen meals */}
      {tagsData && Array.isArray(tagsData) && tagsData.length > 0 && (
        <View style={styles.chipsContainer}>
          {tagsData.slice(0, 5).map((tagItem: { tag: string; count: number }) => {
            const tag = tagItem.tag || tagItem;
            const tagId = typeof tag === 'string' ? tag.toLowerCase() : tag;
            const tagLabel = typeof tag === 'string' 
              ? tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
              : tag;
            
            // Map common tags to colors
            const tagColors: Record<string, { bg: string; border: string; shadow: string }> = {
              'keto': { bg: '#10B981', border: '#10B981', shadow: '#10B981' },
              'vegan': { bg: '#10B981', border: '#10B981', shadow: '#10B981' },
              'vegetarian': { bg: '#10B981', border: '#10B981', shadow: '#10B981' },
              'gluten-free': { bg: '#F59E0B', border: '#F59E0B', shadow: '#F59E0B' },
              'late-night': { bg: '#F59E0B', border: '#F59E0B', shadow: '#F59E0B' },
              'spicy': { bg: '#EF4444', border: '#EF4444', shadow: '#EF4444' },
              'healthy': { bg: '#10B981', border: '#10B981', shadow: '#10B981' },
            };
            
            const colors = tagColors[tagId] || { bg: '#6366F1', border: '#6366F1', shadow: '#6366F1' };
            
            return (
              <TouchableOpacity
                key={tagId}
                style={[
                  {
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: colors.bg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 4,
                    overflow: 'hidden',
                    marginRight: 8,
                  },
                  activeFilters.has(tagId) && styles.chipActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleFilterPress(tagId)}
              >
                <BlurView
                  intensity={40}
                  tint="light"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 14,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#ffffff',
                    letterSpacing: 0.2,
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {tagLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Today's Menu Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today&apos;s Menu</Text>
        
        {isLoadingCategories ? (
          <CategoriesSkeleton />
        ) : categories.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category: any) => {
              const isSelected = selectedCategoryId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.categoryIcon,
                    { backgroundColor: category.backgroundColor },
                    isSelected && styles.categoryIconSelected
                  ]}>
                    {category.icon}
                  </View>
                  <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Search size={32} color="#6B7280" />
            </View>
            <Text style={styles.emptyText}>No categories available</Text>
          </View>
        )}
      </View>

      {/* Show search results if search query is provided, otherwise show filtered/popular meals */}
      {searchQuery && searchQuery.trim().length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {isLoadingSearch ? (
            <MealsSkeleton />
          ) : isErrorSearch ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <AlertCircle size={32} color="#6B7280" />
              </View>
              <Text style={styles.emptyText}>Failed to search meals. Please try again.</Text>
            </View>
          ) : searchMeals.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mealsContainer}
            >
              {searchMeals.map((meal: any) => (
                <TouchableOpacity
                  key={meal._id || meal.id}
                  style={styles.mealCard}
                  onPress={() => {
                    // Navigate to meal details or add to cart
                    console.log('Meal pressed:', meal);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.mealImageContainer}>
                    <Image 
                      source={meal.image ? { uri: meal.image } : require('../../../assets/images/cribnoshpackaging.png')} 
                      style={styles.mealImage} 
                    />
                    {meal.averageRating >= 4.5 && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.badgeText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                    <View style={styles.mealPriceRow}>
                      <Text style={styles.mealPrice}>£{meal.price?.toFixed(2) || '0.00'}</Text>
                      {meal.originalPrice && (
                        <Text style={styles.originalPrice}>£{meal.originalPrice.toFixed(2)}</Text>
                      )}
                    </View>
                    <Text style={styles.deliveryTime}>{meal.prepTime || 30} min</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Search size={32} color="#6B7280" />
              </View>
              <Text style={styles.emptyText}>No meals found</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategoryId || activeFilters.size > 0 ? 'Filtered Meals' : 'Popular Meals'}
            </Text>
            {(selectedCategoryId || activeFilters.size > 0) && (
              <TouchableOpacity onPress={() => { setSelectedCategoryId(null); setActiveFilters(new Set()); }}>
                <Text style={styles.seeAllText}>Clear filters</Text>
              </TouchableOpacity>
            )}
            {!selectedCategoryId && activeFilters.size === 0 && (
              <TouchableOpacity onPress={() => {
                // All items are already shown when no filters are active
                // This button can be used to scroll to top or trigger expansion
              }}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isLoadingMeals ? (
            <MealsSkeleton />
          ) : isErrorMeals ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <AlertCircle size={32} color="#6B7280" />
              </View>
              <Text style={styles.emptyText}>Failed to load meals. Please try again.</Text>
            </View>
          ) : displayMeals.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mealsContainer}
            >
              {displayMeals.map((meal: any) => (
                <TouchableOpacity
                  key={meal._id || meal.id}
                  style={styles.mealCard}
                  onPress={() => {
                    // Navigate to meal details or add to cart
                    console.log('Meal pressed:', meal);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.mealImageContainer}>
                    <Image source={meal.image} style={styles.mealImage} />
                    {meal.isPopular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.badgeText}>Popular</Text>
                      </View>
                    )}
                    {meal.isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.badgeText}>New</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                    <View style={styles.mealPriceRow}>
                      <Text style={styles.mealPrice}>{meal.price}</Text>
                      {meal.originalPrice && (
                        <Text style={styles.originalPrice}>{meal.originalPrice}</Text>
                      )}
                    </View>
                    <Text style={styles.deliveryTime}>{meal.deliveryTime}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Search size={32} color="#6B7280" />
              </View>
              <Text style={styles.emptyText}>
                {selectedCategoryId || activeFilters.size > 0 
                  ? 'No meals found with selected filters'
                  : 'No meals available'}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
});

KitchenBottomSheetContent.displayName = 'KitchenBottomSheetContent';

export { KitchenBottomSheetContent };

const styles = StyleSheet.create({
  container: {
    paddingLeft: 10, // Reduced horizontal padding for better content visibility
    paddingRight: 10, // Added right padding for consistency
    paddingBottom: 250, // Increased from 180 to 250 for much more bottom padding
  },
  deliveryInfo: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#FAFAFA',
    marginBottom: 15,
    paddingHorizontal: 5, // Reduced horizontal padding
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 12,
    marginBottom: 15,
    paddingHorizontal: 0, // Remove extra padding
  },
  section: {
    marginBottom: 20,
  },
  lastSection: {
    paddingBottom: 80, // Add extra bottom padding to the last section
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.03,
    color: '#F3F4F6',
  },
  seeAllText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
  },
  categoriesContainer: {
    // Removed paddingRight for better horizontal scrolling
  },
  categoryItem: {
    width: 75,
    height: 102,
    marginRight: 15, // Reduced margin for better horizontal space utilization
    alignItems: 'center',
  },
  categoryIcon: {
    width: 75,
    height: 75,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    letterSpacing: 0.03,
    color: '#FAFAFA',
  },
  mealsContainer: {
    // Removed paddingRight completely
  },
  mealCard: {
    width: 150,
    height: 200,
    marginRight: 10, // Reduced margin for better horizontal space utilization
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Changed to semi-transparent white for dark background
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Subtle white border
  },
  mealImageContainer: {
    width: '100%',
    height: '60%',
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.03,
    color: '#FFFFFF',
  },
  mealInfo: {
    padding: 10,
    flex: 1,
  },
  mealName: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.03,
    color: '#FAFAFA',
    marginBottom: 5,
  },
  mealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  mealPrice: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.03,
    color: '#FF3B30', // Nosh orange-red
  },
  originalPrice: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
    textDecorationLine: 'line-through',
    marginLeft: 5,
  },
  deliveryTime: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.03,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'Lato',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  chipActive: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  categoryItemSelected: {
    opacity: 0.9,
  },
  categoryIconSelected: {
    borderWidth: 2,
    borderColor: '#FF3B30', // Cribnosh orange-red
    opacity: 1,
  },
  categoryNameSelected: {
    color: '#FF3B30', // Cribnosh orange-red
    fontWeight: '700',
  },
}); 