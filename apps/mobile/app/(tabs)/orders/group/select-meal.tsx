import { Button } from "@/components/ui/Button";
import { useAuthState } from "@/hooks/useAuthState";
import { useGroupOrders } from "@/hooks/useGroupOrders";
import { useMeals } from "@/hooks/useMeals";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SelectedItem {
  dish_id: string;
  name: string;
  quantity: number;
  price: number;
  special_instructions?: string;
}

export default function SelectMealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ group_order_id?: string }>();
  const { user } = useAuthState();
  const groupOrderId = params.group_order_id || "";

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getGroupOrder, getParticipantSelections, updateParticipantSelections } = useGroupOrders();
  
  const [groupOrderData, setGroupOrderData] = useState<any>(null);
  const [selectionsData, setSelectionsData] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isLoadingSelections, setIsLoadingSelections] = useState(false);
  const { getKitchenMeals } = useMeals();
  const [foodCreatorMenusData, setFoodCreatorMenusData] = useState<any>(null);
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);

  useEffect(() => {
    if (groupOrderId) {
      loadGroupOrder();
    }
  }, [groupOrderId]);

  useEffect(() => {
    if (groupOrderId && user?.user_id) {
      loadSelections();
    }
  }, [groupOrderId, user?.user_id]);

  const loadGroupOrder = async () => {
    try {
      setIsLoadingOrder(true);
      const result = await getGroupOrder(groupOrderId);
      if (result.success) {
        setGroupOrderData({ success: true, data: result });
      }
    } catch (_error) {
      // Error already handled in hook
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const loadSelections = async () => {
    try {
      setIsLoadingSelections(true);
      const result = await getParticipantSelections(groupOrderId, user?.user_id);
      if (result.success && result.data?.selections) {
        setSelectionsData({ success: true, data: { selections: result.data.selections } });
      }
    } catch (_error) {
      // Error already handled in hook
    } finally {
      setIsLoadingSelections(false);
    }
  };

  const groupOrder = groupOrderData?.data;
  const currentSelections = selectionsData?.data?.selections?.[0];

  // Fetch chef menu items when group order is loaded
  useEffect(() => {
    if (groupOrder?.chef_id) {
      const loadFoodCreatorMenus = async () => {
        setIsLoadingMenus(true);
        try {
          const result = await getKitchenMeals({
            kitchen_id: groupOrder.chef_id,
            limit: 100,
          });
          if (result?.success) {
            setFoodCreatorMenusData({ data: result.data });
          }
        } catch (_error) {
          // Error already handled in hook
        } finally {
          setIsLoadingMenus(false);
        }
      };
      loadFoodCreatorMenus();
    }
  }, [groupOrder?.chef_id, getKitchenMeals]);

  // Initialize selected items from current selections
  useEffect(() => {
    if (currentSelections?.order_items) {
      setSelectedItems(
        currentSelections.order_items.map((item: any) => ({
          dish_id: item.dish_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          special_instructions: item.special_instructions,
        }))
      );
    }
  }, [currentSelections]);

  // Get menu items from API - only use API data (must be before early returns)
  const menuItems = useMemo(() => {
    // Structure: foodCreatorMenusData = { data: { success: true, data: { meals: [...] } } }
    const meals = foodCreatorMenusData?.data?.meals || foodCreatorMenusData?.data?.data?.meals || [];
    return Array.isArray(meals) ? meals : [];
  }, [foodCreatorMenusData]);

  // Calculate total
  const total = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [selectedItems]);

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0
      setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSelectedItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleSaveSelections = async () => {
    if (!groupOrderId) {
      Alert.alert("Error", "Group order ID is missing");
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one item");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateParticipantSelections({
        group_order_id: groupOrderId,
        order_items: selectedItems,
      });

      if (result.success) {
        Alert.alert("Success", "Your selections have been updated", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (_error: any) {
      // Error already handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingOrder || isLoadingSelections || isLoadingMenus) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E6FFE8" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!groupOrder) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load group order</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft color="#E6FFE8" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Meal</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{groupOrder.restaurant_name}</Text>
          <Text style={styles.infoText}>
            Select items from the menu. Your selections will be shared with the
            group.
          </Text>
        </View>

        {/* Selected Items */}
        {selectedItems.length > 0 ? (
          <View style={styles.selectedContainer}>
            <Text style={styles.sectionTitle}>Your Selections</Text>
            {selectedItems.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.itemControls}>
                  <TouchableOpacity
                    onPress={() =>
                      handleQuantityChange(index, item.quantity - 1)
                    }
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      handleQuantityChange(index, item.quantity + 1)
                    }
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.itemSubtotal}>
                    £{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>£{total.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items selected</Text>
            {menuItems.length > 0 ? (
              <View style={styles.menuContainer}>
                <Text style={styles.sectionTitle}>Menu Items</Text>
                {menuItems.map((item: any) => (
                  <TouchableOpacity
                    key={item._id || item.id}
                    style={styles.menuItemCard}
                    onPress={() => {
                      // Add item to selected items
                      const existingIndex = selectedItems.findIndex(
                        (selected) => selected.dish_id === (item._id || item.id)
                      );
                      if (existingIndex >= 0) {
                        // Increase quantity if already selected
                        handleQuantityChange(
                          existingIndex,
                          selectedItems[existingIndex].quantity + 1
                        );
                      } else {
                        // Add new item
                        setSelectedItems((prev) => [
                          ...prev,
                          {
                            dish_id: item._id || item.id,
                            name: item.name,
                            quantity: 1,
                            price: item.price || 0,
                            special_instructions: "",
                          },
                        ]);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemHeader}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemPrice}>
                        £{((item.price || 0) / 100).toFixed(2)}
                      </Text>
                    </View>
                    {item.description && (
                      <Text
                        style={styles.menuItemDescription}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}
                    {item.prepTime && (
                      <Text style={styles.menuItemPrepTime}>
                        {item.prepTime} min
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySubtext}>
                No menu items available from {groupOrder.restaurant_name}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <Button
          variant="danger"
          size="lg"
          onPress={handleSaveSelections}
          disabled={isSubmitting || selectedItems.length === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#E6FFE8" />
          ) : (
            <Text>Save Selections</Text>
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02120A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    color: "#E6FFE8",
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: "#E6FFE8",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#E6FFE8",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#094327",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "rgba(230, 255, 232, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.1)",
  },
  infoTitle: {
    color: "#E6FFE8",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoText: {
    color: "#EAEAEA",
    fontSize: 14,
    opacity: 0.8,
  },
  selectedContainer: {
    gap: 16,
  },
  sectionTitle: {
    color: "#E6FFE8",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: "rgba(230, 255, 232, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.1)",
    gap: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    color: "#E6FFE8",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  itemPrice: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
  },
  itemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(230, 255, 232, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    color: "#E6FFE8",
    fontSize: 20,
    fontWeight: "600",
  },
  quantityText: {
    color: "#E6FFE8",
    fontSize: 18,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  itemSubtotal: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: "auto",
  },
  totalCard: {
    backgroundColor: "rgba(230, 255, 232, 0.1)",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.2)",
    marginTop: 8,
  },
  totalLabel: {
    color: "#E6FFE8",
    fontSize: 20,
    fontWeight: "600",
  },
  totalAmount: {
    color: "#E6FFE8",
    fontSize: 24,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    color: "#EAEAEA",
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#EAEAEA",
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
  },
  menuContainer: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  menuItemCard: {
    backgroundColor: "rgba(230, 255, 232, 0.05)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.1)",
    marginBottom: 12,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  menuItemName: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  menuItemPrice: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
  },
  menuItemDescription: {
    color: "#EAEAEA",
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  menuItemPrepTime: {
    color: "#EAEAEA",
    fontSize: 12,
    opacity: 0.6,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#02120A",
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(230, 255, 232, 0.1)",
  },
});
