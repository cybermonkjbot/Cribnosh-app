import { SharedOrderingHeader } from "@/components/ui/SharedOrderingHeader";
import { CustomOrder } from "@/types/customer";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useAuthContext } from "@/contexts/AuthContext";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../../lib/ToastContext";

export default function SharedOrderingSetup() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuthContext();
  const [amount, setAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);



  // Fetch existing custom orders from Convex
  const fetchCustomOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.orders.customerGetCustomOrders, {
        sessionToken,
        page: 1,
        limit: 10,
      });

      if (result.success === false) {
        setCustomOrdersError(new Error(result.error || 'Failed to get custom orders'));
        return;
      }

      // Transform to match expected format
      setCustomOrdersData({
        data: result.custom_orders,
      });
    } catch (error: any) {
      console.error('Error fetching custom orders:', error);
      setCustomOrdersError(error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomOrders();
    }
  }, [isAuthenticated, fetchCustomOrders]);

  // Create custom order function
  const createCustomOrder = useCallback(async (data: {
    requirements: string;
    serving_size: number;
    budget?: number;
    desired_delivery_time: string;
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
      desired_delivery_time: data.desired_delivery_time,
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

  const handleAmountSelect = (value: string) => {
    setSelectedAmount(value);
    if (value === "Unlimited") {
      setAmount("");
    } else {
      setAmount(value);
    }
  };

  const handleDone = async () => {
    if (!amount && selectedAmount !== "Unlimited") {
      showToast({
        type: "error",
        title: "Amount Required",
        message: "Please enter or select an amount",
        duration: 3000,
      });
      return;
    }

    try {
      setIsCreatingOrder(true);

      // Create custom order via Convex - dietary restrictions will be added in meal-options screen
      // This is a two-step flow: setup → meal-options, so we create order first, then update with dietary restrictions
      const customOrderData = await createCustomOrder({
        requirements: `Shared ordering for £${amount || "unlimited"}`,
        serving_size: parseInt(amount) || 0,
        budget: amount === "Unlimited" ? undefined : parseFloat(amount) * 100, // Convert to pence
        desired_delivery_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
      });

      showToast({
        type: "success",
        title: "Custom Order Created",
        message: "Your custom order setup is complete!",
        duration: 3000,
      });

      // Navigate to meal options screen with the created order ID
      router.push({
        pathname: "/shared-ordering/meal-options",
        params: { orderId: customOrderData.data._id },
      });
    } catch (error: any) {
      console.error("Error creating custom order:", error);
      
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

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={["#FF3B30", "#FF5740", "#FF3B30"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* Header */}
        <SharedOrderingHeader
          onBack={handleBack}
          onAction={handleDone}
          actionText={isCreatingOrder ? "Creating..." : "Done"}
          actionLoading={isCreatingOrder}
          backIcon="down"
        />

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>
            Let friends{"\n"}and family order on{"\n"}your account
          </Text>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              editable={selectedAmount !== "Unlimited"}
            />
            <Text style={styles.currencySymbol}>£</Text>
          </View>

          {/* Preset Amount Buttons */}
          <View style={styles.presetContainer}>
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
          </View>
        </View>

        {/* Simplified Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.takeoutBox}>
            {/* Takeout Box */}
            <View style={styles.boxContainer}>
              <View style={styles.boxFront}>
                <Text style={styles.japaneseChar}>あ</Text>
              </View>
              <View style={styles.boxTop} />
              <View style={styles.boxLeft} />
              <View style={styles.boxRight} />
              <View style={styles.boxBack} />
            </View>

            {/* Noodles and Food */}
            <View style={styles.foodContainer}>
              <View style={styles.noodles} />
              <View style={styles.protein1} />
              <View style={styles.protein2} />
              <View style={styles.vegetable1} />
              <View style={styles.vegetable2} />
            </View>

            {/* Chopsticks */}
            <View style={styles.chopstick1} />
            <View style={styles.chopstick2} />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 42,
    marginBottom: 40,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    color: "#1A202C",
    fontWeight: "600",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A202C",
    marginLeft: 8,
  },
  presetContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 40,
  },
  presetButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  presetButtonSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  presetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  presetButtonTextSelected: {
    color: "#FF3B30",
    fontWeight: "700",
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
    paddingTop: 20,
    minHeight: 200,
  },
  takeoutBox: {
    position: "relative",
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  boxContainer: {
    position: "relative",
    width: 100,
    height: 70,
  },
  boxFront: {
    position: "absolute",
    width: 100,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  boxTop: {
    position: "absolute",
    width: 100,
    height: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    top: -8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  boxLeft: {
    position: "absolute",
    width: 15,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    left: -8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  boxRight: {
    position: "absolute",
    width: 15,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 8,
    right: -8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  boxBack: {
    position: "absolute",
    width: 100,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  japaneseChar: {
    fontSize: 40,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "bold",
  },
  foodContainer: {
    position: "absolute",
    width: 80,
    height: 50,
    left: 50,
    top: 60,
  },
  noodles: {
    position: "absolute",
    width: 70,
    height: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 18,
    top: 8,
    left: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  protein1: {
    position: "absolute",
    width: 10,
    height: 10,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 5,
    top: 15,
    left: 18,
  },
  protein2: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 4,
    top: 23,
    left: 55,
  },
  vegetable1: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "rgba(230, 255, 232, 0.8)",
    borderRadius: 3,
    top: 18,
    left: 35,
  },
  vegetable2: {
    position: "absolute",
    width: 5,
    height: 5,
    backgroundColor: "rgba(230, 255, 232, 0.8)",
    borderRadius: 2.5,
    top: 27,
    left: 62,
  },
  chopstick1: {
    position: "absolute",
    width: 50,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
    top: 42,
    left: 15,
  },
  chopstick2: {
    position: "absolute",
    width: 50,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
    top: 47,
    left: 20,
  },
});
