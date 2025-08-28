import React from "react";
import { Text, View } from "react-native";

export default function PaymentMethod() {
  return (
    <View className="flex-1 bg-[#F8F8F8] p-5">
      <View>
        <Text>PaymentMethod</Text>
      </View>

      <Text className="text-[#031D11] font-extrabold text-3xl">Payment</Text>

      <View className="mt-5 rounded-2xl p-5 bg-[#F4FFF5] gap-y-4">
        <Text className="text-lg">Cribnosh balance</Text>
        <Text className="font-semibold text-3xl">N0</Text>
        <Text className="text-lg">
          Cribnosh balance is not available with this payment method
        </Text>
      </View>
    </View>
  );
}
