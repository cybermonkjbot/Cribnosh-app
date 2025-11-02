import GroupOrderMember from "@/components/GroupOrderMember";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const items = Array.from({ length: 20 }, (_, i) => ({
  avatarUri: `https://example.com/avatar${i + 1}.png`,
  name: `Item ${i + 1}`,
}));

export default function RandomImage() {
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
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {rows.map((row, index) => (
          <View
            key={index}
            style={[
              styles.row,
              row.type === "even" ? styles.rowEven : styles.rowOdd,
            ]}
          >
            {row.items.map((item, idx) => (
              <GroupOrderMember key={idx} avatarUri={item.avatarUri} name={item.name} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    padding: 20, // p-5
    backgroundColor: '#FFFFFF', // bg-white
  },
  row: {
    flexDirection: 'row', // flex-row
    marginBottom: 16, // mb-4
    justifyContent: 'space-between', // justify-between
  },
  rowOdd: {
    paddingHorizontal: 0, // px-0
  },
  rowEven: {
    paddingHorizontal: '8%', // px-[8%]
  },
});
