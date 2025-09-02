import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import { Link, router } from "expo-router";
import { CarFront } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IncrementalOrderAmount from "../IncrementalOrderAmount";
import ChooseFriend from "./ChooseFriend";

export default function CartScreen() {
  const OrderItems = [
    {
      name: "Sharwama",
      price: "16",
      image: require("@/assets/images/sample.png"),
      quantity: 1,
    },
    {
      name: "Lentil Soup",
      price: "18",
      image: require("@/assets/images/sushi.png"),
      quantity: 1,
    },
  ];

  const [isOpen, setIsOpen] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    // Handle quantity change logic here
    console.log(`Item ${index} quantity changed to ${newQuantity}`);
  };

  return (
    <SafeAreaView className="flex-1 p-5 bg-white">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex flex-col flex-1">
          <View className="flex-1">
            <View className="flex flex-row items-center justify-between">
              <Pressable onPress={handleBack}>
                <Entypo name="chevron-down" size={18} color="#094327" />
              </Pressable>
              <Text className="text-lg font-medium text-center text-dark-green">
                My Cart
              </Text>
              <Pressable>
                <Feather name="trash-2" size={18} color="#094327" />
              </Pressable>
            </View>
            <View className="">
              {OrderItems.map((item, index) => (
                <View
                  className="border-b py-5 border-[#F3F4F6] flex flex-row justify-between items-center"
                  key={index}
                >
                  <View className="flex flex-row items-center gap-3">
                    <View className="bg-[#eaeaea] h-20 w-20 rounded-xl p-2">
                      <Image
                        source={item.image}
                        className="w-full h-full rounded-xl"
                      />
                    </View>
                    <View>
                      <Text>{item.name}</Text>
                      <Text
                        className="font-bold"
                        style={{ fontWeight: "bold" }}
                      >
                        £ {item.price}
                      </Text>
                    </View>
                  </View>

                  <IncrementalOrderAmount
                    initialValue={item.quantity}
                    onChange={(newQuantity) => handleQuantityChange(index, newQuantity)}
                  />
                </View>
              ))}
            </View>
            <View>
              <View className="flex flex-row justify-between mt-8 border-b pb-2 border-[#F3F4F6]">
                <View className="flex flex-row gap-x-2 flex-1">
                  <View className="p-2 rounded-full bg-dark-green flex-shrink-0">
                    <CarFront color={"white"} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold">
                      Delivery in 38-64 mins
                    </Text>
                    <Text className="text-lg">32 Springfield Rd</Text>
                  </View>
                </View>

                <Entypo name="chevron-right" size={24} color="#094327" />
              </View>
              <View className="flex flex-row justify-between mt-5 border-b pb-2 border-[#F3F4F6]">
                <View className="flex flex-row items-center gap-x-2">
                  <View className="p-2">
                    <Image
                      className="w-8 h-8"
                      source={require("@/assets/images/nosh-pass.png")}
                    />
                  </View>
                  <Text className="text-lg font-bold">Nosh Pass</Text>
                </View>

                <View className="flex flex-row items-center gap-x-[1px]">
                  <Text className="font-bold text-dark-green">#EarlyBird</Text>
                  <Entypo name="chevron-right" size={24} color="#094327" />
                </View>
              </View>
              <View className="flex flex-row justify-between items-center mt-5 border-b pb-2 border-[#F3F4F6]">
                <View className="flex flex-row items-center flex-1 gap-x-2">
                  <View className="p-2">
                    <Image
                      className="w-8 h-8"
                      source={require("@/assets/images/utensils.png")}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold">Cutlery</Text>
                    <Text className="text-[#6B7280] text-sm">
                      We do not include cutlery by default for sustainability{" "}
                    </Text>
                  </View>
                </View>

                <Pressable className="bg-[#F3F4F6] rounded-2xl p-2">
                  <Text className="text-lg font-semibold">Include</Text>
                </Pressable>
              </View>
              <View className="flex flex-row justify-between items-center mt-5 border-b pb-2 border-[#F3F4F6]">
                <View className="flex flex-row items-center flex-1 gap-x-2">
                  <View className="p-2">
                    <Image
                      className="w-[29px] h-[17px]"
                      source={require("@/assets/images/share.png")}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold">
                      Ask a friend to pay
                    </Text>
                    <Text className="text-sm text-[#6B7280]">
                      We do not include cutlery by default for sustainability{" "}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setIsOpen(true)}
                  className="bg-[#F3F4F6] rounded-2xl p-2"
                >
                  <Text className="text-lg font-semibold">Choose</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="mt-12">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-lg font-inter text-dark-green">
                Delivery Fee
              </Text>
              <Text className="text-lg font-bold text-dark-green">£ 9</Text>
            </View>
            <View className="flex flex-row items-center justify-between">
              <Text className="text-lg font-bold">Total </Text>
              <Text className="text-lg font-bold">£ 34</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Continue Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-200">
        <Link asChild href={"/orders/cart/sides"}>
          <Pressable className="bg-[#FF3B30] rounded-2xl p-5 flex items-center justify-center">
            <Text className="text-lg font-bold text-white">Continue to Sides</Text>
          </Pressable>
        </Link>
      </View>

      <ChooseFriend isOpen={isOpen} onClick={() => setIsOpen(false)} />
    </SafeAreaView>
  );
}
