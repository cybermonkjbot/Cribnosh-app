import { Entypo, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function PaymentMethodSelection() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: require("@/assets/images/mastercard-logo.png"),
      description: "**** **** **** 3095",
      isDefault: true,
    },
    {
      id: "apple",
      name: "Apple Pay",
      icon: null,
      description: "Quick and secure payment",
      isDefault: false,
    },
    {
      id: "balance",
      name: "Cribnosh Balance",
      icon: require("@/assets/images/nosh-pass.png"),
      description: "Use your available balance",
      isDefault: false,
      disabled: true,
    },
  ];

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = () => {
    // Go back to sides screen with selected payment method
    router.back();
  };

  const renderPaymentMethodIcon = (method: any) => {
    if (method.icon) {
      return (
        <Image
          source={method.icon}
          className="w-12 h-8 mr-4"
          resizeMode="contain"
        />
      );
    }
    
    // Fallback for Apple Pay
    if (method.id === "apple") {
      return (
        <View className="w-12 h-8 mr-4 bg-black rounded-lg items-center justify-center">
          <Text className="text-white font-bold text-xs">Apple</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
          <Pressable onPress={handleBack}>
            <Entypo name="chevron-down" size={24} color="#094327" />
          </Pressable>
          <Text className="text-lg font-semibold text-center text-gray-900">
            Payment Method
          </Text>
          <View className="w-6" />
        </View>

        {/* Payment Methods */}
        <View className="px-5 py-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Choose Payment Method
          </Text>
          
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              onPress={() => !method.disabled && setSelectedPaymentMethod(method.id)}
              className={`flex flex-row items-center justify-between p-4 rounded-2xl mb-3 border-2 ${
                selectedPaymentMethod === method.id
                  ? "border-[#FF3B30] bg-red-50"
                  : "border-gray-200 bg-white"
              } ${method.disabled ? "opacity-50" : ""}`}
              disabled={method.disabled}
            >
              <View className="flex flex-row items-center flex-1">
                {renderPaymentMethodIcon(method)}
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    {method.name}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {method.description}
                  </Text>
                  {method.isDefault && (
                    <Text className="text-xs text-[#FF3B30] font-medium mt-1">
                      Default
                    </Text>
                  )}
                </View>
              </View>
              
              {selectedPaymentMethod === method.id && (
                <View className="w-6 h-6 bg-[#FF3B30] rounded-full items-center justify-center">
                  <Feather name="check" size={16} color="white" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Add New Payment Method */}
        <View className="px-5 mb-6">
          <Pressable className="flex flex-row items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-2xl">
            <Feather name="plus" size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-2 font-medium">
              Add New Payment Method
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View className="px-5 py-4 border-t border-gray-200 bg-white">
        <Pressable
          onPress={handleConfirm}
          className="bg-[#FF3B30] rounded-2xl p-5 items-center"
        >
          <Text className="text-lg font-bold text-white">Confirm Selection</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
