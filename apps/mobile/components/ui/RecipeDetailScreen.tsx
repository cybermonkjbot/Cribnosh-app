import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { getSessionToken } from "@/lib/convexClient";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeletonBox } from "./MealItemDetails/Skeletons/ShimmerBox";

interface RecipeDetailScreenProps {
  recipeId: string;
  onClose: () => void;
}

export function RecipeDetailScreen({ recipeId, onClose }: RecipeDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session token
  useEffect(() => {
    const loadToken = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
    };
    loadToken();
  }, []);

  // Use reactive query to fetch recipe
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const recipe = useQuery(
    api.queries.recipes.getRecipeById,
    recipeId ? { recipeId: recipeId as any, sessionToken: sessionToken || undefined } : "skip"
  );

  const isLoading = recipe === undefined;
  const error = recipe === null ? "Recipe not found" : null;

  const formatTime = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }, []);

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe</Text>
          <View style={styles.placeholder} />
        </View>

        {isLoading ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Recipe Image Skeleton */}
            <SkeletonBox width="100%" height={300} borderRadius={0} />

            {/* Recipe Info Skeleton */}
            <View style={styles.content}>
              {/* Title Skeleton */}
              <SkeletonBox width="80%" height={32} borderRadius={4} style={{ marginBottom: 12 }} />

              {/* Description Skeleton */}
              <View style={{ marginBottom: 24 }}>
                <SkeletonBox width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonBox width="95%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonBox width="85%" height={16} borderRadius={4} />
              </View>

              {/* Meta Info Skeleton */}
              <View style={styles.metaContainer}>
                {[1, 2, 3, 4].map((index) => (
                  <View key={index} style={styles.metaItem}>
                    <SkeletonBox width={60} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonBox width={50} height={18} borderRadius={4} />
                  </View>
                ))}
              </View>

              {/* Tags Skeleton */}
              <View style={styles.tagsContainer}>
                <SkeletonBox width={70} height={28} borderRadius={16} />
                <SkeletonBox width={80} height={28} borderRadius={16} />
              </View>

              {/* Ingredients Section Skeleton */}
              <View style={styles.section}>
                <SkeletonBox width={120} height={28} borderRadius={4} style={{ marginBottom: 16 }} />
                {[1, 2, 3, 4, 5].map((index) => (
                  <SkeletonBox
                    key={index}
                    width="100%"
                    height={48}
                    borderRadius={8}
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </View>

              {/* Instructions Section Skeleton */}
              <View style={styles.section}>
                <SkeletonBox width={140} height={28} borderRadius={4} style={{ marginBottom: 16 }} />
                {[1, 2, 3, 4].map((index) => (
                  <View key={index} style={styles.instructionItem}>
                    <SkeletonBox width={32} height={32} borderRadius={16} />
                    <SkeletonBox width="85%" height={60} borderRadius={4} />
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : error || !recipe ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || "Recipe not found"}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Recipe Image */}
            {recipe.featuredImage && (
              <Image
                source={{ uri: recipe.featuredImage }}
                style={styles.recipeImage}
                resizeMode="cover"
              />
            )}

            {/* Recipe Info */}
            <View style={styles.content}>
              <Text style={styles.title}>{recipe.title}</Text>
              {recipe.description && (
                <Text style={styles.description}>{recipe.description}</Text>
              )}

              {/* Meta Info */}
              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Prep Time</Text>
                  <Text style={styles.metaValue}>{formatTime(recipe.prepTime)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Cook Time</Text>
                  <Text style={styles.metaValue}>{formatTime(recipe.cookTime)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Servings</Text>
                  <Text style={styles.metaValue}>{recipe.servings}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Difficulty</Text>
                  <Text style={styles.metaValue} className="capitalize">
                    {recipe.difficulty}
                  </Text>
                </View>
              </View>

              {/* Cuisine & Dietary */}
              <View style={styles.tagsContainer}>
                {recipe.cuisine && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{recipe.cuisine}</Text>
                  </View>
                )}
                {recipe.dietary?.map((diet: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{diet}</Text>
                  </View>
                ))}
              </View>

              {/* Ingredients */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {recipe.ingredients.map((ingredient: any, index: number) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientText}>
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Instructions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {recipe.instructions.map((instruction: string, index: number) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>

              {/* Author */}
              {recipe.author && (
                <View style={styles.authorContainer}>
                  <Text style={styles.authorLabel}>Recipe by</Text>
                  <Text style={styles.authorName}>{recipe.author}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  recipeImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#F3F4F6",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  metaItem: {
    flex: 1,
    minWidth: "45%",
  },
  metaLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 32,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  ingredientItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  authorContainer: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  authorLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  authorName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
});

