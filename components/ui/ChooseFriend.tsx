import { Entypo } from "@expo/vector-icons";
import { Search } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import GroupOrderMember from "../GroupOrderMember";
import LinkModal from "./LinkModal";

interface ChooseFriend {
  isVisible: boolean;
  onClose: () => void;
}

const items = Array.from({ length: 5 }, (_, i) => ({
  avatarUri: `https://example.com/avatar${i + 1}.png`,
  name: `Item ${i + 1}`,
}));

interface Item {
  items: any;
  type: string;
}

interface Box {
  avatarUri: string;
  name: string;
}

const rows: Item[] = [];
let i = 0;

while (i < items.length) {
  // Odd row (3 items)
  rows.push({ items: items.slice(i, i + 3), type: "odd" });
  i += 3;

  // Even row (2 items)
  if (i < items.length) {
    rows.push({ items: items.slice(i, i + 2), type: "even" });
    i += 2;
  }
}

interface Modal {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChooseFriend({ isOpen, onClick }: Modal) {
  const [linkModal, setLinkModal] = useState(false);
  return (
    <View
      className={`flex-1 p-5 bg-[#02120A] pt-10 ${
        isOpen ? "flex" : "hidden"
      } absolute w-screen h-screen`}
    >
      <View className="flex flex-row items-center justify-between">
        <Pressable onPress={onClick}>
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

        <View className="mt-5">
          {rows.map((row, index) => (
            <View
              key={index}
              className={`flex-row mb-4 justify-between ${
                row.type === "even" ? "px-[8%]" : "px-0"
              }`}
            >
              {row.items.map((item: Box, idx: number) => (
                <Pressable onPress={() => setLinkModal(true)} key={idx}>
                  <GroupOrderMember
                    avatarUri={item.avatarUri}
                    name={item.name}
                  />
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>
      <LinkModal isOpen={linkModal} onClick={() => setLinkModal(false)} />
    </View>
  );
}
