import React from "react";
import { Pressable, Text, View } from "react-native";

export default function LinkModal() {
  return (
    <View className="flex-1 z-40  absolute w-screen flex items-center justify-center h-full">
      <View
        style={{ opacity: 0.5 }}
        className="flex-1 z-40 bg-black absolute w-screen flex items-center justify-center h-full"
      />
      <View className="h-full w-full items-center justify-center px-5">
        <View className="h-auto bg-[#FAFFFA]/80 w-full z-50 p-5 gap-y-3 items-center rounded-xl">
          <Text className="font-[#171A1F] text-2xl mt-5">
            Payment Link Created
          </Text>
          <Text className="font-[#171A1F] text-lg px-4 text-center">
            The link will be active for 1 hour. When expired the order would be
            automatically canvelled
          </Text>
          <View className="flex flex-row gap-x-4">
            <Pressable className="bg-white p-4 rounded-xl flex-1 items-center">
              <Text className="text-[#565D6D]">Cancel</Text>
            </Pressable>

            <Pressable className="bg-white p-4 rounded-xl flex-1 items-center">
              <Text className="text-[#094327">Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
