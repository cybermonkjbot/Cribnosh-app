import GroupOrderMember from "@/components/GroupOrderMember";
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const items = Array.from({ length: 20 }, (_, i) => ({
  avatarUri: `https://example.com/avatar${i + 1}.png`,
  name: `Item ${i + 1}`,
}));

export default function Index() {
  const rows = [];
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

  return (
    <SafeAreaView className="flex-1 p-5 bg-white">
      <ScrollView>
        {rows.map((row, index) => (
          <View
            key={index}
            className={`flex-row mb-4 justify-between ${
              row.type === "even" ? "px-[8%]" : "px-0"
            }`}
          >
            {row.items.map((item, idx) => (
              <GroupOrderMember avatarUri={item.avatarUri} name={item.name} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
