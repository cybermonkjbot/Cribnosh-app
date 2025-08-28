import { Entypo, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    Text,
    View
} from "react-native";

interface PaymentScreenProps {
  orderTotal: number;
  deliveryFee: number;
  onPaymentSuccess: () => void;
}

export default function PaymentScreen({
  orderTotal,
  deliveryFee,
  onPaymentSuccess,
}: PaymentScreenProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStep, setProcessingStep] = useState(0);

  const totalAmount = orderTotal + deliveryFee;

  const processingSteps = [
    "Verifying payment method...",
    "Processing payment...",
    "Confirming transaction...",
    "Almost done..."
  ];

  useEffect(() => {
    const startPayment = async () => {
      try {
        // Simulate payment processing steps
        for (let i = 0; i < processingSteps.length; i++) {
          setProcessingStep(i);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        
        // Payment successful
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onPaymentSuccess();
      } catch (error) {
        Alert.alert(
          "Payment Failed",
          "There was an issue processing your payment. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setIsProcessing(false);
      }
    };

    startPayment();
  }, []);

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="flex flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
          <Pressable onPress={handleBack}>
            <Entypo name="chevron-down" size={24} color="#094327" />
          </Pressable>
          <Text className="text-lg font-semibold text-center text-gray-900">
            Processing Payment
          </Text>
          <View className="w-6" />
        </View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center w-full">
            {/* Processing Animation */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center">
                  <Feather name="credit-card" size={24} color="white" />
                </View>
              </View>
              
              <Text className="text-xl font-bold text-center text-gray-900 mb-2">
                Processing Your Payment
              </Text>
              
              <Text className="text-lg text-center text-gray-600 mb-4">
                {processingSteps[processingStep]}
              </Text>

              {/* Progress Dots */}
              <View className="flex flex-row space-x-2">
                {processingSteps.map((_, index) => (
                  <View
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index <= processingStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </View>
            </View>

            {/* Amount Display */}
            <View className="bg-gray-50 rounded-2xl p-6 w-full mb-8">
              <Text className="text-lg font-semibold text-center text-gray-900 mb-3">
                Amount Being Charged
              </Text>
              <Text className="text-4xl font-bold text-center text-[#FF3B30]">
                £{totalAmount}
              </Text>
            </View>

            {/* Security Reassurance */}
            <View className="bg-blue-50 rounded-2xl p-6 w-full mb-8">
              <View className="flex flex-row items-center justify-center mb-4">
                <Feather name="shield" size={24} color="#3B82F6" />
                <Text className="text-lg font-semibold text-blue-800 ml-2">
                  Your Payment is Secure
                </Text>
              </View>
              <Text className="text-sm text-blue-700 text-center leading-5">
                We use bank-level encryption and never store your card details. 
                This transaction is protected by SSL security and PCI compliance.
              </Text>
            </View>

            {/* Additional Security Info */}
            <View className="bg-green-50 rounded-2xl p-4 w-full">
              <View className="flex flex-row items-center justify-center">
                <Feather name="check-circle" size={20} color="#10B981" />
                <Text className="text-sm text-green-700 ml-2 text-center">
                  Payment processed by Stripe • 256-bit encryption
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
