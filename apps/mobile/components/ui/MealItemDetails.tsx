import { useAuthContext } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useMeals } from "@/hooks/useMeals";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showError, showSuccess, showWarning } from "../../lib/GlobalToastManager";
import { navigateToSignIn } from "../../utils/signInNavigationGuard";
import { CartButton } from "./CartButton";
import { DietCompatibilityBar } from "./MealItemDetails/DietCompatibilityBar";
import { FoodCreatorNotes } from "./MealItemDetails/FoodCreatorNotes";
import { FoodCreatorInfo } from "./MealItemDetails/FoodCreatorInfo";
import { MealBadges } from "./MealItemDetails/MealBadges";
import { MealDescription } from "./MealItemDetails/MealDescription";
import { MealHeader } from "./MealItemDetails/MealHeader";
import { MealImage } from "./MealItemDetails/MealImage";
import { MealInfo } from "./MealItemDetails/MealInfo";
import { MealIngredients } from "./MealItemDetails/MealIngredients";
import { MealTitle } from "./MealItemDetails/MealTitle";
import { NutritionalInfo } from "./MealItemDetails/NutritionalInfo";
import { SimilarMeals } from "./MealItemDetails/SimilarMeals";
import {
  DietCompatibilityBarSkeleton,
  FoodCreatorNotesSkeleton,
  FoodCreatorInfoSkeleton,
  MealBadgesSkeleton,
  MealDescriptionSkeleton,
  MealImageSkeleton,
  MealInfoSkeleton,
  MealIngredientsSkeleton,
  MealTitleSkeleton,
  NutritionalInfoSkeleton,
} from "./MealItemDetails/Skeletons";

interface MealItemDetailsProps {
  mealId: string;
  onBack: () => void;
  isLoading?: boolean;
  isLoadingSimilarMeals?: boolean;
  mealData?: {
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    foodCreatorName: string;
    foodCreatorAvatar?: string;
    foodCreatorId?: string;
    foodcreatorId?: string;
    calories: number;
    fat: string;
    protein: string;
    carbs: string;
    dietCompatibility: number; // percentage
    dietMessage: string;
    ingredients: {
      name: string;
      quantity: string;
      isAllergen?: boolean;
      allergenType?: string;
    }[];
    isVegetarian?: boolean;
    isSafeForYou?: boolean;
    // New fields for additional sections
    prepTime?: string;
    deliveryTime?: string;
    foodCreatorName?: string;
    foodCreatorStory?: string;
    foodCreatorTips?: string[];
    similarMeals?: {
      id: string;
      name: string;
      price: string;
      imageUrl?: string;
      sentiment?: "bussing" | "mid" | "notIt";
      isVegetarian?: boolean;
    }[];
  };
  onAddToCart?: (mealId: string, quantity: number) => void;
  onSimilarMealPress?: (mealId: string) => void;
  onFoodCreatorNamePress?: (foodCreatorName: string, foodCreatorId?: string, foodcreatorId?: string) => void;
}

export function MealItemDetails({
  mealId,
  onBack,
  isLoading: propIsLoading = false,
  isLoadingSimilarMeals: isLoadingSimilarMealsProp = false,
  mealData,
  onAddToCart,
  onSimilarMealPress,
  onFoodCreatorNamePress,
}: MealItemDetailsProps) {
  const [quantity] = useState(1);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const { addToCart } = useCart();
  const {
    getDishDetails,
    getDishFavoriteStatus,
    addDishFavorite,
    removeDishFavorite,
    getSimilarMeals,
  } = useMeals();

  const [dishDetailsData, setDishDetailsData] = useState<any>(null);
  const [isLoadingDishDetails, setIsLoadingDishDetails] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState<any>(null);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [isRemovingFavorite, setIsRemovingFavorite] = useState(false);
  const [similarDishesData, setSimilarDishesData] = useState<any>(null);
  const [isLoadingSimilarMealsFromApi, setIsLoadingSimilarMealsFromApi] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  // Get favorite status from API
  const isFavorite = favoriteStatus?.isFavorited ?? false;

  // Use refs to store stable function references and avoid dependency issues
  const getDishDetailsRef = useRef(getDishDetails);
  const getDishFavoriteStatusRef = useRef(getDishFavoriteStatus);
  const getSimilarMealsRef = useRef(getSimilarMeals);
  const isMountedRef = useRef(true);

  // Update refs when functions change
  useEffect(() => {
    getDishDetailsRef.current = getDishDetails;
    getDishFavoriteStatusRef.current = getDishFavoriteStatus;
    getSimilarMealsRef.current = getSimilarMeals;
  }, [getDishDetails, getDishFavoriteStatus, getSimilarMeals]);

  // Set mounted ref to true on mount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check if mealData prop has all required fields to skip API calls
  const hasCompleteMealData = useMemo(() => {
    if (!mealData) return false;
    // Check for essential fields that would make API call unnecessary
    return !!(
      mealData.title &&
      mealData.foodCreatorName &&
      mealData.price !== undefined &&
      mealData.description
    );
  }, [mealData]);

  // Reset state when mealId changes
  useEffect(() => {
    if (mealId) {
      setDishDetailsData(null);
      setFavoriteStatus(null);
      setSimilarDishesData(null);
      setIsAddedToCart(false);
    }
  }, [mealId]);

  // Parallelized data fetching - single useEffect that fetches all data in parallel
  useEffect(() => {
    if (!mealId) return;

    // Determine what needs to be fetched
    const needsDishDetails = !hasCompleteMealData;
    const needsFavoriteStatus = isAuthenticated;
    // Similar meals are deferred - loaded after a delay to improve initial render

    // Build array of promises for parallel execution
    const fetchPromises: Promise<void>[] = [];

    // Fetch dish details if needed
    if (needsDishDetails) {
      fetchPromises.push(
        (async () => {
          try {
            if (!isMountedRef.current) return;
            setIsLoadingDishDetails(true);
            const result = await getDishDetailsRef.current(mealId);
            if (!isMountedRef.current) return;
            if (result.success) {
              setDishDetailsData({ success: true, data: result.data });
            }
          } catch (error) {
            // Error already handled in hook
          } finally {
            if (isMountedRef.current) {
              setIsLoadingDishDetails(false);
            }
          }
        })()
      );
    }

    // Fetch favorite status if needed (always fetch when authenticated, state reset handles mealId changes)
    if (needsFavoriteStatus) {
      fetchPromises.push(
        (async () => {
          try {
            if (!isMountedRef.current) return;
            setIsLoadingFavorite(true);
            const result = await getDishFavoriteStatusRef.current(mealId);
            if (!isMountedRef.current) return;
            if (result.success) {
              setFavoriteStatus(result.data);
            }
          } catch (error) {
            // Error already handled in hook
          } finally {
            if (isMountedRef.current) {
              setIsLoadingFavorite(false);
            }
          }
        })()
      );
    }

    // Execute all fetches in parallel using Promise.allSettled for better error handling
    if (fetchPromises.length > 0) {
      Promise.allSettled(fetchPromises).then((results) => {
        // Log any rejected promises
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Error loading meal data (promise ${index}):`, result.reason);
          }
        });
      });
    }
  }, [mealId, hasCompleteMealData, isAuthenticated]);

  // Defer similar meals loading to improve initial render time
  useEffect(() => {
    if (!mealId) return;

    // Delay similar meals loading by 500ms to prioritize main content
    const timeoutId = setTimeout(() => {
      const loadSimilarMeals = async () => {
        try {
          if (!isMountedRef.current) return;
          setIsLoadingSimilarMealsFromApi(true);
          const result = await getSimilarMealsRef.current(mealId, 5);
          if (!isMountedRef.current) return;
          if (result.success) {
            setSimilarDishesData({ success: true, data: result.data });
          }
        } catch (error) {
          // Error already handled in hook
        } finally {
          if (isMountedRef.current) {
            setIsLoadingSimilarMealsFromApi(false);
          }
        }
      };
      loadSimilarMeals();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [mealId]);

  // Transform API dish details to mealData format
  const apiMealData = useMemo(() => {
    if (!dishDetailsData?.success || !dishDetailsData.data) return undefined;

    const dish = dishDetailsData.data as any; // Type assertion for API response
    return {
      title: dish.name || '',
      description: dish.description || '',
      price: typeof dish.price === 'string'
        ? parseFloat((dish.price as string).replace(/[£$]/g, '')) * 100
        : (dish.price || 0),
      imageUrl: dish.image_url || (dish as any).images?.[0],
      foodCreatorName: dish.foodCreator_name || (dish as any).chef?.name || '',
      foodCreatorAvatar: (dish as any).chef?.profile_image || (dish as any).foodCreator_image,
      foodCreatorId: dish.foodCreator_id || (dish as any).chef?.id,
      foodcreatorId: (dish as any).chef?.id,
      calories: dish.calories || 0,
      fat: dish.fat || '0g',
      protein: dish.protein || '0g',
      carbs: dish.carbs || '0g',
      dietCompatibility: dish.diet_compatibility || 0,
      dietMessage: dish.diet_message || '',
      ingredients: dish.ingredients?.map((ing: any) => ({
        name: ing.name || ing,
        quantity: ing.quantity || '',
        isAllergen: ing.is_allergen || false,
        allergenType: ing.allergen_type,
      })) || [],
      isVegetarian: dish.is_vegetarian || (dish as any).dietary?.includes('vegetarian'),
      isSafeForYou: dish.is_safe_for_you !== undefined ? dish.is_safe_for_you : true,
      prepTime: dish.prep_time || (dish as any).preparation_time,
      deliveryTime: dish.delivery_time,
      foodCreatorName: (dish as any).chef?.name,
      foodCreatorStory: (dish as any).chef?.story || (dish as any).chef?.bio,
      foodCreatorTips: (dish as any).chef_tips || (dish as any).tips || [],
      // Extract reviews and sentiment for sentiment bar
      reviews: dish.reviews || [],
      sentiment: dish.sentiment || undefined,
    };
  }, [dishDetailsData]);

  // Prioritize API data over prop data - only use prop data if API is not available
  // Memoize finalMealData to avoid unnecessary recalculations
  const finalMealData = useMemo(() => {
    return apiMealData || mealData;
  }, [apiMealData, mealData]);

  const isLoading = isLoadingDishDetails || (propIsLoading && !apiMealData);

  // Use API similar meals data - prioritize API data over prop data
  const similarMeals = useMemo(() => {
    if (similarDishesData?.success && similarDishesData.data?.dishes) {
      return similarDishesData.data.dishes.map((dish: any) => ({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        imageUrl: dish.imageUrl || dish.image_url,
        sentiment: dish.sentiment,
        isVegetarian: dish.isVegetarian || dish.is_vegetarian,
      }));
    }
    // Fallback to prop data only if API has no data
    if (mealData?.similarMeals) {
      return mealData.similarMeals;
    }
    return undefined;
  }, [similarDishesData, mealData?.similarMeals]);

  const isLoadingSimilarMeals = isLoadingSimilarMealsProp || isLoadingSimilarMealsFromApi;

  // Memoize handleAddToCart callback to prevent unnecessary re-renders
  const handleAddToCart = useCallback(async () => {
    // Prevent rapid clicks
    if (isAddingToCart) return;

    if (!finalMealData?.title) return;

    // Check authentication and token validity
    if (!isAuthenticated || !token) {
      showWarning(
        'Authentication Required',
        'Please sign in to add items to cart'
      );
      navigateToSignIn();
      return;
    }

    // Check if token is expired and refresh auth state if needed
    const isExpired = checkTokenExpiration();
    if (isExpired) {
      // Refresh auth state to update isAuthenticated
      await refreshAuthState();
      showWarning(
        'Session Expired',
        'Please sign in again to add items to cart'
      );
      navigateToSignIn();
      return;
    }

    try {
      setIsAddingToCart(true);
      const result = await addToCart(mealId, quantity);

      if (result.success) {
        showSuccess('Added to Cart!', result.data?.item?.name || finalMealData.title);
        // Call the optional callback if provided (for backwards compatibility)
        onAddToCart?.(mealId, quantity);
        // Set added state to show "Added" button state
        setIsAddedToCart(true);
        // Reset added state after 3 seconds
        setTimeout(() => {
          setIsAddedToCart(false);
        }, 3000);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to add item to cart';
      showError('Failed to add item to cart', errorMessage);
    } finally {
      setIsAddingToCart(false);
    }
  }, [finalMealData, isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCart, mealId, quantity, onAddToCart, isAddingToCart]);

  // Memoize handleFavorite callback to prevent unnecessary re-renders
  const handleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to favorite meals',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!mealId) return;

    try {
      if (isFavorite) {
        setIsRemovingFavorite(true);
        const result = await removeDishFavorite(mealId);
        if (result.success) {
          // Reload favorite status
          const statusResult = await getDishFavoriteStatusRef.current(mealId);
          if (statusResult.success) {
            setFavoriteStatus(statusResult.data);
          }
        }
      } else {
        setIsAddingFavorite(true);
        const result = await addDishFavorite(mealId);
        if (result.success) {
          // Reload favorite status
          const statusResult = await getDishFavoriteStatusRef.current(mealId);
          if (statusResult.success) {
            setFavoriteStatus(statusResult.data);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Error already handled in hook
    } finally {
      setIsAddingFavorite(false);
      setIsRemovingFavorite(false);
    }
  }, [isAuthenticated, mealId, isFavorite, removeDishFavorite, addDishFavorite]);

  // Determine which sections have data
  const hasBasicInfo = !isLoading && finalMealData?.title && finalMealData?.foodCreatorName;
  const hasFoodCreatorInfo = hasBasicInfo && finalMealData.foodCreatorName;
  const hasMealImage = hasBasicInfo && (finalMealData.imageUrl !== undefined || finalMealData.title);
  const hasMealTitle = hasBasicInfo && finalMealData.title;
  const hasMealBadges = hasBasicInfo && (finalMealData.isVegetarian !== undefined || finalMealData.isSafeForYou !== undefined);
  const hasMealDescription = hasBasicInfo && finalMealData.description;
  const hasMealInfo = hasBasicInfo && (finalMealData.prepTime || finalMealData.deliveryTime);
  const hasDietCompatibility = hasBasicInfo && finalMealData.dietCompatibility !== undefined;
  const hasNutritionalInfo = hasBasicInfo && finalMealData.calories !== undefined;
  const hasIngredients = hasBasicInfo && finalMealData.ingredients && finalMealData.ingredients.length > 0;
  const hasFoodCreatorNotes = hasBasicInfo && (finalMealData.foodCreatorStory || (finalMealData.foodCreatorTips && finalMealData.foodCreatorTips.length > 0));
  const hasSimilarMeals = !isLoadingSimilarMeals && similarMeals && similarMeals.length > 0;

  return (
    <View style={styles.container}>
      {/* Container with rounded top corners */}
      <View style={styles.mainContainer}>
        {/* Header Component */}
        <MealHeader
          onBack={onBack}
          onFavorite={handleFavorite}
          isFavorite={isFavorite}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 + Math.max(insets.bottom, 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* FoodCreator Info Component - positioned at top */}
          {hasFoodCreatorInfo ? (
            <FoodCreatorInfo
              foodCreatorName={finalMealData.foodCreatorName}
              foodCreatorAvatar={finalMealData.foodCreatorAvatar}
              onPress={() => onFoodCreatorNamePress?.(finalMealData.foodCreatorName, finalMealData.foodCreatorId, finalMealData.foodcreatorId)}
            />
          ) : (
            <FoodCreatorInfoSkeleton />
          )}

          {/* Meal Image Component */}
          {hasMealImage ? (
            <MealImage imageUrl={finalMealData.imageUrl} title={finalMealData.title} />
          ) : (
            <MealImageSkeleton />
          )}

          {/* Meal Title Component */}
          {hasMealTitle ? (
            <MealTitle title={finalMealData.title} />
          ) : (
            <MealTitleSkeleton />
          )}

          {/* Meal Badges Component - chips under the title */}
          {hasMealBadges ? (
            <MealBadges
              isVegetarian={finalMealData.isVegetarian}
              isSafeForYou={finalMealData.isSafeForYou}
            />
          ) : (
            <MealBadgesSkeleton />
          )}

          {/* Meal Description Component */}
          {hasMealDescription ? (
            <MealDescription
              description={finalMealData.description}
              foodCreatorName={finalMealData.foodCreatorName}
              onFoodCreatorNamePress={() => onFoodCreatorNamePress?.(finalMealData.foodCreatorName, finalMealData.foodCreatorId, finalMealData.foodcreatorId)}
            />
          ) : (
            <MealDescriptionSkeleton />
          )}

          {/* Meal Info Component */}
          {hasMealInfo ? (
            <MealInfo
              prepTime={finalMealData.prepTime}
              deliveryTime={finalMealData.deliveryTime}
            />
          ) : (
            <MealInfoSkeleton />
          )}

          {/* Diet Compatibility Bar Component */}
          {hasDietCompatibility ? (
            <DietCompatibilityBar
              compatibility={finalMealData.dietCompatibility}
              reviews={(finalMealData as any).reviews}
              sentiment={(finalMealData as any).sentiment}
            />
          ) : (
            <DietCompatibilityBarSkeleton />
          )}

          {/* Nutritional Info Component */}
          {hasNutritionalInfo ? (
            <NutritionalInfo
              calories={finalMealData.calories}
              fat={finalMealData.fat}
              protein={finalMealData.protein}
              carbs={finalMealData.carbs}
              dietMessage={finalMealData.dietMessage}
            />
          ) : (
            <NutritionalInfoSkeleton />
          )}

          {/* Ingredients Component */}
          {hasIngredients ? (
            <MealIngredients ingredients={finalMealData.ingredients} />
          ) : (
            <MealIngredientsSkeleton />
          )}

          {/* Food Creator Notes Component */}
          {hasFoodCreatorNotes ? (
            <FoodCreatorNotes
              story={finalMealData.foodCreatorStory}
              tips={finalMealData.foodCreatorTips}
              foodCreatorName={finalMealData.foodCreatorName}
              foodCreatorAvatar={finalMealData.foodCreatorAvatar}
            />
          ) : (
            <FoodCreatorNotesSkeleton />
          )}

          {/* Similar Meals Component */}
          <SimilarMeals
            meals={hasSimilarMeals ? similarMeals : undefined}
            isLoading={isLoadingSimilarMeals || !hasSimilarMeals}
            onMealPress={onSimilarMealPress}
          />
        </ScrollView>
      </View>

      {/* Add to Cart Button Component - Floating above everything with proper safe area handling */}
      <CartButton
        quantity={quantity}
        onPress={handleAddToCart}
        variant="view"
        position="absolute"
        bottom={Math.max(insets.bottom, 30)}
        left={20}
        right={20}
        buttonText={isAddedToCart ? "Added" : "Add to Cart"}
        showIcon={false}
        disabled={isAddingToCart || isAddedToCart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
