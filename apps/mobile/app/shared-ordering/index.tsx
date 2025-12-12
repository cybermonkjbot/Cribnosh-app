import { RegionAvailabilityModal } from "@/components/ui/RegionAvailabilityModal";
import { useRegionAvailability } from "@/hooks/useRegionAvailability";
import { useUserLocation } from "@/hooks/useUserLocation";
import { setRouteContext } from "@/utils/authErrorHandler";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from '@/convex/_generated/api';
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Dimensions,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../lib/ToastContext";
import Dropdown, { DropdownOption } from "../components/Dropdown";

const { height: screenHeight } = Dimensions.get("window");

export default function SharedOrderingIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    amount?: string; 
    selectedAmount?: string; 
    selectedDiet?: string;
  }>();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuthContext();
  const [amount, setAmount] = useState(""); // No default - user must enter amount
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null); // No default
  const [selectedDiet, setSelectedDiet] = useState<string>("none"); // Default to "No restrictions"
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  // Regional availability check
  const { checkAddress } = useRegionAvailability();
  const { location: userLocation } = useUserLocation();

  // Get session token for reactive queries
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  useEffect(() => {
    const loadToken = async () => {
      if (isAuthenticated) {
        const token = await getSessionToken();
        setSessionToken(token);
      } else {
        setSessionToken(null);
      }
    };
    loadToken();
  }, [isAuthenticated]);

  // Get user by session token (reactive query)
  const user = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken ? { sessionToken } : "skip"
  );

  // Get user profile (reactive query)
  const profileDataRaw = useQuery(
    api.queries.users.getUserProfile,
    user?._id && sessionToken ? { userId: user._id, sessionToken } : "skip"
  );

  // Transform profile data to match expected format
  const profileData = useMemo(() => {
    if (!profileDataRaw) return null;
    return {
      data: {
        ...profileDataRaw,
      },
    };
  }, [profileDataRaw]);

  // Restore form state from params if returning from sign-in
  useEffect(() => {
    if (params.amount !== undefined) {
      setAmount(params.amount);
    }
    if (params.selectedAmount !== undefined) {
      setSelectedAmount(params.selectedAmount === "null" ? null : params.selectedAmount);
    }
    if (params.selectedDiet !== undefined) {
      setSelectedDiet(params.selectedDiet);
    }
  }, [params.amount, params.selectedAmount, params.selectedDiet]);

  // Create custom order function
  const createCustomOrder = useCallback(async (data: {
    requirements: string;
    serving_size: number;
    budget?: number;
    desired_delivery_time?: string;
    dietary_restrictions?: string;
  }) => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const result = await convex.action(api.actions.orders.customerCreateCustomOrder, {
      sessionToken,
      requirements: data.requirements,
      serving_size: data.serving_size,
      desired_delivery_time: data.desired_delivery_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      budget: data.budget,
      dietary_restrictions: data.dietary_restrictions,
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to create custom order');
    }

    // Transform to match expected format
    return {
      data: result.custom_order,
    };
  }, []);



  const presetAmounts = ["10", "20", "50", "Unlimited"];

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

  const handleAmountSelect = (value: string) => {
    setSelectedAmount(value);
    if (value === "Unlimited") {
      setAmount("");
    } else {
      setAmount(value);
    }
    // Haptic feedback on selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDietSelect = (option: DropdownOption) => {
    setSelectedDiet(option.value);
  };

  const isValidAmount = () => {
    if (selectedAmount === "Unlimited") return true;
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount >= 1;
  };

  const handleContinue = async () => {
    if (!isValidAmount()) {
      showToast({
        type: "error",
        title: "Invalid Amount",
        message: "Please enter a valid amount (minimum £1) or select a preset",
        duration: 3000,
      });
      return;
    }

    Keyboard.dismiss();

    try {
      setIsCreatingOrder(true);

      // Check regional availability before creating order
      // Use saved address from profile, or check current location city
      let isRegionSupported = false;
      
      if (profileData?.data?.address) {
        // Check saved address
        isRegionSupported = checkAddress(profileData.data.address);
      } else if (userLocation) {
        // If we have coordinates but no saved address, we can't check region
        // For now, we'll allow it and let the server-side check handle it
        // In the future, we could use reverse geocoding to get the city
        isRegionSupported = true; // Allow and let server-side check handle it
      } else {
        // No location info available - allow and let server-side check handle it
        isRegionSupported = true;
      }

      if (!isRegionSupported) {
        setShowRegionModal(true);
        setIsCreatingOrder(false);
        return;
      }

      // Set route context for 401 error handling - preserves form state
      setRouteContext("/shared-ordering", {
        amount,
        selectedAmount: selectedAmount || null,
        selectedDiet,
      });

      // Create custom order via Convex with both budget and dietary restrictions in one call
      const customOrderData = await createCustomOrder({
        requirements: `Shared ordering for £${amount || "unlimited"}`,
        serving_size: parseInt(amount) || 0,
        budget:
          selectedAmount === "Unlimited"
            ? undefined
            : parseFloat(amount) * 100, // Convert to pence
        dietary_restrictions: selectedDiet !== "none" ? selectedDiet : undefined,
      });

      // Navigate directly to "it's on you" screen
      router.push("/shared-ordering/its-on-you");
    } catch (error: any) {
      console.error("Error creating custom order:", error);
      
      // Skip error handling for 401 errors - global handler already redirected to sign-in
      const errorStatus = error?.status || error?.data?.error?.code || error?.data?.status;
      const errorCode = error?.data?.error?.code;
      if (errorStatus === 401 || errorStatus === "401" || errorCode === 401 || errorCode === "401") {
        return;
      }
      
      // Handle other errors
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to create custom order. Please try again.";
      showToast({
        type: "error",
        title: "Setup Failed",
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Background image */}
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/on-your-account-image-01.png")}
            style={styles.takeoutImage}
            resizeMode="contain"
          />
        </View>

        {/* Header with back and continue */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleContinue}
            style={[
              styles.continueButton,
              (!isValidAmount() || isCreatingOrder) &&
                styles.continueButtonDisabled,
            ]}
            disabled={!isValidAmount() || isCreatingOrder}
          >
            <Text
              style={[
                styles.continueText,
                (!isValidAmount() || isCreatingOrder) &&
                  styles.continueTextDisabled,
              ]}
            >
              {isCreatingOrder ? "Creating..." : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Floating Content */}
          <View style={styles.floatingContent}>
            {/* Title */}
            <Text style={styles.title}>
              Let friends{"\n"}and family order on{"\n"}your account
            </Text>

            {/* Budget Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Choose Budget</Text>

              {/* Amount Input */}
              <View style={[styles.inputContainer, styles.inputContainerLeft]}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#999"
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    setSelectedAmount(null); // Clear preset selection when typing
                  }}
                  keyboardType="numeric"
                  editable={selectedAmount !== "Unlimited"}
                  onBlur={() => Keyboard.dismiss()}
                />
                <Text style={styles.currencySymbol}>£</Text>
              </View>

              {/* Preset Amount Buttons */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetContainer}
                style={styles.presetScrollView}
              >
                {presetAmounts.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      selectedAmount === preset && styles.presetButtonSelected,
                    ]}
                    onPress={() => handleAmountSelect(preset)}
                  >
                    <Text
                      style={[
                        styles.presetButtonText,
                        selectedAmount === preset &&
                          styles.presetButtonTextSelected,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Meal Options Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Meal Options</Text>
              <Text style={styles.sectionDescription}>
                You can limit this to a diet or let them choose, remember
                it&apos;s one time only
              </Text>

              {/* Select Diet Dropdown */}
              <View style={styles.dropdownContainer}>
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
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Region Availability Modal */}
      <RegionAvailabilityModal
        isVisible={showRegionModal}
        onClose={() => setShowRegionModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF3B30",
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
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  continueButton: {
    padding: 8,
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueTextDisabled: {
    color: "#ccc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: screenHeight * 0.12,
    paddingBottom: 40,
  },
  floatingContent: {
    marginHorizontal: 20,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "left",
    marginBottom: 32,
    lineHeight: 34,
    textShadowColor: "#094327",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionDescription: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  inputContainerLeft: {
    alignSelf: "flex-start",
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginLeft: 8,
  },
  presetScrollView: {
    marginTop: 8,
    paddingLeft: 0,
    paddingRight: 0,
  },
  presetContainer: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 20,
  },
  presetButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    minWidth: 60,
    justifyContent: "center",
  },
  presetButtonSelected: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  presetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  presetButtonTextSelected: {
    fontWeight: "800",
    color: "#fff",
  },
  dropdownContainer: {
    alignSelf: "flex-start",
  },
  selectDietButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
