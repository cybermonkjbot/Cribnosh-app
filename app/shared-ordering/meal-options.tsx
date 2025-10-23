import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetCustomOrdersQuery } from "../../app/store/customerApi";
import { useToast } from "../../lib/ToastContext";
import Dropdown, { DropdownOption } from "../components/Dropdown";

export default function MealOptions() {
  const { showToast } = useToast();
  const [selectedDiet, setSelectedDiet] = useState<string>("");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Fetch existing custom orders for fallback data
  const { data: customOrdersData, error: customOrdersError } =
    useGetCustomOrdersQuery(
      { page: 1, limit: 10 },
      {
        skip: false, // Always fetch to check if we have data
      }
    );

  const dietOptions: DropdownOption[] = [
    { label: "No restrictions", value: "none" },
    { label: "Vegetarian", value: "vegetarian" },
    { label: "Vegan", value: "vegan" },
    { label: "Gluten-free", value: "gluten-free" },
    { label: "Keto", value: "keto" },
    { label: "Paleo", value: "paleo" },
    { label: "Halal", value: "halal" },
    { label: "Kosher", value: "kosher" },
    { label: "Low-carb", value: "low-carb" },
    { label: "Dairy-free", value: "dairy-free" },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = async () => {
    try {
      setIsUpdatingOrder(true);

      // TODO: When PUT /custom_orders/{id} endpoint is available, integrate here
      // For now, we'll simulate the update process

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if we have existing custom orders from API
      const hasApiData =
        customOrdersData?.data?.orders &&
        customOrdersData.data.orders.length > 0;

      if (hasApiData) {
        showToast({
          type: "success",
          title: "Dietary Preferences Updated",
          message: "Your custom order has been updated!",
          duration: 3000,
        });
      } else {
        // Fallback to mock data
        showToast({
          type: "info",
          title: "Using Demo Mode",
          message: "Dietary preferences saved with demo data",
          duration: 3000,
        });
      }

      // Navigate to "it's on you" screen
      router.push("/shared-ordering/its-on-you");
    } catch (error) {
      console.error("Error updating custom order:", error);
      showToast({
        type: "error",
        title: "Update Failed",
        message: "Failed to update dietary preferences. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleDietSelect = (option: DropdownOption) => {
    setSelectedDiet(option.value);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back and confirm */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ChevronLeft size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          style={[
            styles.confirmButton,
            isUpdatingOrder && styles.confirmButtonDisabled,
          ]}
          disabled={isUpdatingOrder}
        >
          <Text
            style={[
              styles.confirmText,
              isUpdatingOrder && styles.confirmTextDisabled,
            ]}
          >
            {isUpdatingOrder ? "Updating..." : "Confirm"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Meal{"\n"}Options</Text>

        {/* Description */}
        <Text style={styles.description}>
          You can limit this On me to diet or let them choose, remember
          it&apos;s one time only
        </Text>

        {/* Select Diet Dropdown */}
        <Dropdown
          options={dietOptions}
          selectedValue={selectedDiet}
          onSelect={handleDietSelect}
          placeholder="Select Diet"
          buttonStyle={styles.selectDietButton}
          dropdownStyle={styles.dropdownStyle}
          optionStyle={styles.optionStyle}
          textStyle={styles.selectDietText}
          maxHeight={300}
        />

        {/* Takeout box image */}
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/on-your-account-image-01.png")}
            style={styles.takeoutImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02120A",
  },
  imageContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    height: "60%",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: -10,
  },
  takeoutImage: {
    width: "90%",
    height: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  confirmButton: {
    padding: 8,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmTextDisabled: {
    color: "#ccc",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    lineHeight: 52,
    marginBottom: 24,
    textShadowColor: "#FF3B30",
    textShadowOffset: { width: 6, height: 6 },
    textShadowRadius: 4,
    zIndex: 10,
  },
  description: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
    marginBottom: 32,
  },
  selectDietButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "60%",
    alignSelf: "flex-start",
    minHeight: 48,
  },
  selectDietText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "400",
  },
  dropdownStyle: {
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  optionStyle: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
