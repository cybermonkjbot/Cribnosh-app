import { useGetDishDetailsQuery, useGetSimilarDishesQuery } from "@/store/customerApi";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartButton } from "./CartButton";
import { ChefNotes } from "./MealItemDetails/ChefNotes";
import { DietCompatibilityBar } from "./MealItemDetails/DietCompatibilityBar";
import { KitchenInfo } from "./MealItemDetails/KitchenInfo";
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
  ChefNotesSkeleton,
  DietCompatibilityBarSkeleton,
  KitchenInfoSkeleton,
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
    kitchenName: string;
    kitchenAvatar?: string;
    kitchenId?: string;
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
    chefName?: string;
    chefStory?: string;
    chefTips?: string[];
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
  onKitchenNamePress?: (kitchenName: string, kitchenId?: string, foodcreatorId?: string) => void;
}

export function MealItemDetails({
  mealId,
  onBack,
  isLoading: propIsLoading = false,
  isLoadingSimilarMeals: isLoadingSimilarMealsProp = false,
  mealData,
  onAddToCart,
  onSimilarMealPress,
  onKitchenNamePress,
}: MealItemDetailsProps) {
  const [quantity] = useState(2);
  const [isFavorite, setIsFavorite] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Fetch dish details from API if mealData is not provided
  const { data: dishDetailsData, isLoading: isLoadingDishDetails } = useGetDishDetailsQuery(
    mealId,
    {
      skip: !mealId || mealData !== undefined,
    }
  );

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
      kitchenName: dish.kitchen_name || (dish as any).chef?.name || '',
      kitchenAvatar: (dish as any).chef?.profile_image || (dish as any).kitchen_image,
      kitchenId: dish.kitchen_id || (dish as any).chef?.id,
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
      chefName: (dish as any).chef?.name,
      chefStory: (dish as any).chef?.story || (dish as any).chef?.bio,
      chefTips: (dish as any).chef_tips || (dish as any).tips || [],
    };
  }, [dishDetailsData]);

  // Use API mealData if props not provided, otherwise use props
  const finalMealData = mealData || apiMealData;
  const isLoading = isLoadingDishDetails || (propIsLoading && !mealData);

  // Fetch similar meals if not provided via props
  const { data: similarDishesData, isLoading: isLoadingSimilarMealsFromApi } = useGetSimilarDishesQuery(
    { dishId: mealId, limit: 5 },
    { skip: !mealId || (mealData?.similarMeals !== undefined) }
  );

  // Use provided similar meals or fetch from API
  const similarMeals = useMemo(() => {
    if (mealData?.similarMeals) {
      return mealData.similarMeals;
    }
    if (similarDishesData?.success && similarDishesData.data?.dishes) {
      return similarDishesData.data.dishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        imageUrl: dish.image_url,
        sentiment: dish.sentiment,
        isVegetarian: dish.is_vegetarian,
      }));
    }
    return undefined;
  }, [mealData?.similarMeals, similarDishesData]);

  const isLoadingSimilarMeals = isLoadingSimilarMealsProp || isLoadingSimilarMealsFromApi;

  const handleAddToCart = () => {
    if (!finalMealData?.title) return;
    onAddToCart?.(mealId, quantity);
    console.log(`Added ${quantity} of ${finalMealData.title} to cart`);
    // Use absolute path with tabs prefix to ensure correct navigation
    // This prevents navigation through group orders stack
    router.push("/(tabs)/orders/cart" as any);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Determine which sections have data
  const hasBasicInfo = !isLoading && finalMealData?.title && finalMealData?.kitchenName;
  const hasKitchenInfo = hasBasicInfo && finalMealData.kitchenName;
  const hasMealImage = hasBasicInfo && (finalMealData.imageUrl !== undefined || finalMealData.title);
  const hasMealTitle = hasBasicInfo && finalMealData.title;
  const hasMealBadges = hasBasicInfo && (finalMealData.isVegetarian !== undefined || finalMealData.isSafeForYou !== undefined);
  const hasMealDescription = hasBasicInfo && finalMealData.description;
  const hasMealInfo = hasBasicInfo && (finalMealData.prepTime || finalMealData.deliveryTime);
  const hasDietCompatibility = hasBasicInfo && finalMealData.dietCompatibility !== undefined;
  const hasNutritionalInfo = hasBasicInfo && finalMealData.calories !== undefined;
  const hasIngredients = hasBasicInfo && finalMealData.ingredients && finalMealData.ingredients.length > 0;
  const hasChefNotes = hasBasicInfo && (finalMealData.chefStory || (finalMealData.chefTips && finalMealData.chefTips.length > 0));
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
          {/* Kitchen Info Component - positioned at top */}
          {hasKitchenInfo ? (
            <KitchenInfo
              kitchenName={finalMealData.kitchenName}
              kitchenAvatar={finalMealData.kitchenAvatar}
              onPress={() => onKitchenNamePress?.(finalMealData.kitchenName, finalMealData.kitchenId, finalMealData.foodcreatorId)}
            />
          ) : (
            <KitchenInfoSkeleton />
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
              kitchenName={finalMealData.kitchenName}
              onKitchenNamePress={() => onKitchenNamePress?.(finalMealData.kitchenName, finalMealData.kitchenId, finalMealData.foodcreatorId)}
            />
          ) : (
            <MealDescriptionSkeleton />
          )}

          {/* Meal Info Component */}
          {hasMealInfo ? (
            <MealInfo
              prepTime={finalMealData.prepTime || "15 min"}
              deliveryTime={finalMealData.deliveryTime || "30 min"}
            />
          ) : (
            <MealInfoSkeleton />
          )}

          {/* Diet Compatibility Bar Component */}
          {hasDietCompatibility ? (
            <DietCompatibilityBar compatibility={finalMealData.dietCompatibility} />
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

          {/* Chef Notes Component */}
          {hasChefNotes ? (
            <ChefNotes
              story={finalMealData.chefStory}
              tips={finalMealData.chefTips}
              chefName={finalMealData.chefName}
              chefAvatar={finalMealData.kitchenAvatar}
            />
          ) : (
            <ChefNotesSkeleton />
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
        buttonText="Add to Cart"
        showIcon={false}
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
