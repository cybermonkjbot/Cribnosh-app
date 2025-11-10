import { SharedOrderingHeader } from "@/components/ui/SharedOrderingHeader";
import {
    useGetCustomOrderQuery,
    useUpdateCustomOrderMutation,
} from "@/store/customerApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../lib/ToastContext";
import Dropdown, { DropdownOption } from "../components/Dropdown";

export default function MealOptions() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { showToast } = useToast();
  const [selectedDiet, setSelectedDiet] = useState<string>("");
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Fetch the specific custom order to check if dietary restrictions are already set
  const customOrderId = typeof orderId === "string" ? orderId : undefined;
  const { data: customOrderData } = useGetCustomOrderQuery(
    customOrderId || "",
    {
      skip: !customOrderId,
    }
  );

  const [updateCustomOrder] = useUpdateCustomOrderMutation();

  // Check if dietary restrictions are already set and match selection
  useEffect(() => {
    if (customOrderData?.data?.dietary_restrictions) {
      const existingRestrictions = customOrderData.data.dietary_restrictions;
      // If dietary restrictions are already set, pre-select them
      if (typeof existingRestrictions === 'string') {
        setSelectedDiet(existingRestrictions);
      } else if (Array.isArray(existingRestrictions) && existingRestrictions.length > 0) {
        setSelectedDiet(existingRestrictions[0]);
      }
    }
  }, [customOrderData]);

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
    if (!customOrderId) {
      showToast({
        type: "error",
        title: "Order Not Found",
        message: "Unable to find custom order. Please try again.",
        duration: 3000,
      });
      return;
    }

    // Check if dietary restrictions are already set and match selection
    const existingRestrictions = customOrderData?.data?.dietary_restrictions;
    const newRestrictions = selectedDiet && selectedDiet !== "none" ? selectedDiet : null;
    
    // If dietary restrictions haven't changed, skip the update
    if (existingRestrictions === newRestrictions || 
        (Array.isArray(existingRestrictions) && existingRestrictions.length > 0 && existingRestrictions[0] === newRestrictions) ||
        (typeof existingRestrictions === 'string' && existingRestrictions === newRestrictions)) {
      // Dietary restrictions already match, skip update
      router.push("/shared-ordering/its-on-you");
      return;
    }

    try {
      setIsUpdatingOrder(true);

      // Update custom order via API only if dietary restrictions have changed
      await updateCustomOrder({
        customOrderId,
        data: {
          details: {
            dietary_restrictions:
              selectedDiet && selectedDiet !== "none"
                ? [selectedDiet]
                : undefined,
          },
        },
      }).unwrap();

      showToast({
        type: "success",
        title: "Dietary Preferences Updated",
        message: "Your custom order has been updated!",
        duration: 3000,
      });

      // Navigate to "it's on you" screen
      router.push("/shared-ordering/its-on-you");
    } catch (error: any) {
      console.error("Error updating custom order:", error);
      
      // Skip error handling for 401 errors - global handler already redirected to sign-in
      const errorStatus = error?.status || error?.data?.error?.code || error?.data?.status;
      const errorCode = error?.data?.error?.code;
      if (errorStatus === 401 || errorStatus === "401" || errorCode === 401 || errorCode === "401") {
        return;
      }
      
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to update dietary preferences. Please try again.";
      showToast({
        type: "error",
        title: "Update Failed",
        message: errorMessage,
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <SharedOrderingHeader
        onBack={handleBack}
        onAction={handleConfirm}
        actionText={isUpdatingOrder ? "Updating..." : "Confirm"}
        actionLoading={isUpdatingOrder}
        backIcon="left"
        showBackText={true}
      />

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
