import { Entypo } from "@expo/vector-icons";
import { Search } from "lucide-react-native";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinkModal from "./LinkModal";

interface ChooseFriend {
  isVisible: boolean;
  onClose: () => void;
}

export default function ChooseFriend() {
  return (
    <SafeAreaView className="flex-1 p-5 bg-[#02120A]">
      <View className="flex flex-row items-center justify-between">
        <Pressable>
          <Entypo name="chevron-down" size={18} color="#ffffff" />
        </Pressable>

        <Pressable>
          <Text className="text-lg font-medium text-center text-white">
            Share
          </Text>
        </Pressable>
      </View>
      <View>
        <Text className="text-white text-[48px] font-semibold border">
          Choose a friend to pay
        </Text>
        <Text className="text-white text-2xl">
          We'll send the link straight to your selection
        </Text>
        <View className="flex flex-row items-center bg-white/30 mt-5 p-2 rounded-xl">
          <Search size={16} color={"white"} />
          <TextInput
            placeholder="Search friends and Family"
            placeholderTextColor={"white"}
          />
        </View>
      </View>
      <LinkModal />
    </SafeAreaView>
  );
}
