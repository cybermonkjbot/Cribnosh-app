import { useRouter } from "expo-router";
import { useState } from "react";
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
  isLoading = false,
  isLoadingSimilarMeals = false,
  mealData,
  onAddToCart,
  onSimilarMealPress,
  onKitchenNamePress,
}: MealItemDetailsProps) {
  const [quantity] = useState(2);
  const [isFavorite, setIsFavorite] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleAddToCart = () => {
    if (!mealData?.title) return;
    onAddToCart?.(mealId, quantity);
    console.log(`Added ${quantity} of ${mealData.title} to cart`);
    router.push("/orders/cart");  
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Determine which sections have data
  const hasBasicInfo = !isLoading && mealData?.title && mealData?.kitchenName;
  const hasKitchenInfo = hasBasicInfo && mealData.kitchenName;
  const hasMealImage = hasBasicInfo && (mealData.imageUrl !== undefined || mealData.title);
  const hasMealTitle = hasBasicInfo && mealData.title;
  const hasMealBadges = hasBasicInfo && (mealData.isVegetarian !== undefined || mealData.isSafeForYou !== undefined);
  const hasMealDescription = hasBasicInfo && mealData.description;
  const hasMealInfo = hasBasicInfo && (mealData.prepTime || mealData.deliveryTime);
  const hasDietCompatibility = hasBasicInfo && mealData.dietCompatibility !== undefined;
  const hasNutritionalInfo = hasBasicInfo && mealData.calories !== undefined;
  const hasIngredients = hasBasicInfo && mealData.ingredients && mealData.ingredients.length > 0;
  const hasChefNotes = hasBasicInfo && (mealData.chefStory || (mealData.chefTips && mealData.chefTips.length > 0));
  const hasSimilarMeals = !isLoadingSimilarMeals && mealData?.similarMeals && mealData.similarMeals.length > 0;

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
              kitchenName={mealData.kitchenName}
              kitchenAvatar={mealData.kitchenAvatar}
              onPress={() => onKitchenNamePress?.(mealData.kitchenName, mealData.kitchenId, mealData.foodcreatorId)}
            />
          ) : (
            <KitchenInfoSkeleton />
          )}

          {/* Meal Image Component */}
          {hasMealImage ? (
            <MealImage imageUrl={mealData.imageUrl} title={mealData.title} />
          ) : (
            <MealImageSkeleton />
          )}

          {/* Meal Title Component */}
          {hasMealTitle ? (
            <MealTitle title={mealData.title} />
          ) : (
            <MealTitleSkeleton />
          )}

          {/* Meal Badges Component - chips under the title */}
          {hasMealBadges ? (
            <MealBadges
              isVegetarian={mealData.isVegetarian}
              isSafeForYou={mealData.isSafeForYou}
            />
          ) : (
            <MealBadgesSkeleton />
          )}

          {/* Meal Description Component */}
          {hasMealDescription ? (
            <MealDescription
              description={mealData.description}
              kitchenName={mealData.kitchenName}
              onKitchenNamePress={() => onKitchenNamePress?.(mealData.kitchenName, mealData.kitchenId, mealData.foodcreatorId)}
            />
          ) : (
            <MealDescriptionSkeleton />
          )}

          {/* Meal Info Component */}
          {hasMealInfo ? (
            <MealInfo
              prepTime={mealData.prepTime || "15 min"}
              deliveryTime={mealData.deliveryTime || "30 min"}
            />
          ) : (
            <MealInfoSkeleton />
          )}

          {/* Diet Compatibility Bar Component */}
          {hasDietCompatibility ? (
            <DietCompatibilityBar compatibility={mealData.dietCompatibility} />
          ) : (
            <DietCompatibilityBarSkeleton />
          )}

          {/* Nutritional Info Component */}
          {hasNutritionalInfo ? (
            <NutritionalInfo
              calories={mealData.calories}
              fat={mealData.fat}
              protein={mealData.protein}
              carbs={mealData.carbs}
              dietMessage={mealData.dietMessage}
            />
          ) : (
            <NutritionalInfoSkeleton />
          )}

          {/* Ingredients Component */}
          {hasIngredients ? (
            <MealIngredients ingredients={mealData.ingredients} />
          ) : (
            <MealIngredientsSkeleton />
          )}

          {/* Chef Notes Component */}
          {hasChefNotes ? (
            <ChefNotes
              story={mealData.chefStory}
              tips={mealData.chefTips}
              chefName={mealData.chefName}
              chefAvatar={mealData.kitchenAvatar}
            />
          ) : (
            <ChefNotesSkeleton />
          )}

          {/* Similar Meals Component */}
          <SimilarMeals
            meals={hasSimilarMeals ? mealData.similarMeals : undefined}
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
