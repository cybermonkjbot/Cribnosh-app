import OnTheWay from "@/components/ui/OnTheWay";
import Entypo from "@expo/vector-icons/Entypo";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  const [onTheWayModal, setOnTheWayModal] = useState(false);
  return (
    <SafeAreaView className="flex-1 p-5 bg-[02120A]">
      <View className="flex flex-col justify-between flex-1">
        <View className="flex-1">
          <View className="flex flex-row items-center justify-between">
            <Pressable>
              <Entypo name="chevron-down" size={18} color="white" />
            </Pressable>
            <Text className="text-lg font-[500] text-center text-white">
              Sides & Card
            </Text>
            <Pressable></Pressable>
          </View>
          <View className="">
            {OrderItems.map((item, index) => (
              <View
                className="py-5 border-[#F3F4F6] flex flex-row justify-between items-center"
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
                    <Text className="text-white">{item.name}</Text>
                    <Text
                      className="font-bold text-white"
                      style={{ fontWeight: "bold" }}
                    >
                      £ {item.price}
                    </Text>
                  </View>
                </View>

                <View className="flex flex-row items-center gap-x-3 w-20 bg-[#eaeaea] h-8 rounded-xl px-2">
                  <Pressable className="items-center justify-center flex-1">
                    <Text className="text-xl">-</Text>
                  </Pressable>
                  <Text className="flex-1 font-bold text-center">
                    {item.quantity}
                  </Text>
                  <Pressable className="items-center justify-center flex-1">
                    <Text className="text-xl">+</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View>
            <Text className="text-lg font-bold text-white">Payment method</Text>
            <View className="flex flex-row items-center justify-between my-5 gap-x-2">
              <View className="flex flex-row items-center gap-x-2">
                <Image
                  className="w-[32.26px] h-[25px]"
                  source={require("@/assets/images/mastercard-logo.png")}
                />
                <Text className="text-white">**** **** **** 3095</Text>
              </View>

              <Pressable className="px-4 py-2 border-2 border-white rounded-full">
                <Text className="font-bold text-white">Change</Text>
              </Pressable>
            </View>
            <View className="flex flex-row items-center justify-between my-5 gap-x-2">
              <View className="w-2/3 gap-2 my-5">
                <Image
                  source={require("@/assets/images/livelogo.png")}
                  className="w-[146.63px] h-[23px]"
                />
                <Text className="text-white">
                  These options are limited by Your Diet Preferences{" "}
                  <Text className="font-bold text-white">Update Diet</Text>
                </Text>
              </View>
              <View></View>
            </View>
          </View>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-lg text-white font-inter">Delivery Fee</Text>
            <Text className="text-lg font-bold text-white">£ 9</Text>
          </View>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">Total </Text>
            <Text className="text-lg font-bold text-white">£ 36</Text>
          </View>
          <Pressable
            onPress={() => setOnTheWayModal(true)}
            className="bg-[#FF3B30] rounded-2xl p-5 flex items-center justify-center mt-5"
          >
            <Text className="text-lg font-bold text-white">Pay</Text>
          </Pressable>
        </View>
      </View>
      <OnTheWay
        isVisible={onTheWayModal}
        onClose={() => setOnTheWayModal(false)}
      />
    </SafeAreaView>
  );
}
