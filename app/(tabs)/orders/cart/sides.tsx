import IncrementalOrderAmount from "@/components/IncrementalOrderAmount";
import Entypo from "@expo/vector-icons/Entypo";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
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

  const handleBack = () => {
    router.back();
  };

  const handleProceedToPayment = () => {
    // Go directly to payment processing, not payment method selection
    router.push("/orders/cart/payment");
  };

  const handleChangePaymentMethod = () => {
    // This will lead to payment method selection
    router.push("/orders/cart/payment-method");
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    // Handle quantity change logic here
    console.log(`Item ${index} quantity changed to ${newQuantity}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#02120A]">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex flex-col justify-between flex-1 p-5">
          <View className="flex-1">
            <View className="flex flex-row items-center justify-between mb-6">
              <Pressable onPress={handleBack}>
                <Entypo name="chevron-down" size={18} color="white" />
              </Pressable>
              <Text className="text-lg font-[500] text-center text-white">
                Sides & Extras
              </Text>
              <View className="w-6" />
            </View>
            
            <View className="mb-12">
              {OrderItems.map((item, index) => (
                <View
                  className="py-5 flex flex-row justify-between items-center"
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

                  <IncrementalOrderAmount
                    initialValue={item.quantity}
                    onChange={(newQuantity) => handleQuantityChange(index, newQuantity)}
                  />
                </View>
              ))}
            </View>

            <View className="mb-8">
              <Text className="text-lg font-bold text-white mt-4 mb-8">Payment method</Text>
              <View className="flex flex-row items-center justify-between mb-5 gap-x-2">
                <View className="flex flex-row items-center gap-x-2">
                  <Image
                    className="w-[32.26px] h-[25px]"
                    source={require("@/assets/images/mastercard-logo.png")}
                  />
                  <Text className="text-white">**** **** **** 3095</Text>
                </View>

                <Pressable 
                  onPress={handleChangePaymentMethod}
                  className="px-4 py-2 border-2 border-white rounded-full"
                >
                  <Text className="font-bold text-white">Change</Text>
                </Pressable>
              </View>
              
              <View className="flex flex-row items-center justify-between mb-5 gap-x-2">
                <View className="w-2/3 gap-2">
                  <Image
                    source={require("@/assets/images/livelogo.png")}
                    className="w-[146.63px] h-[23px]"
                  />
                  <Text className="text-white mt-2">
                    These options are limited by Your Diet Preferences{" "}
                    <Text className="font-bold text-white">Update Diet</Text>
                  </Text>
                </View>
                <View></View>
              </View>
            </View>

            <View className="pt-4 border-t border-gray-700">
              <View className="flex flex-row items-center justify-between mb-3">
                <Text className="text-lg text-white font-inter">Delivery Fee</Text>
                <Text className="text-lg font-bold text-white">£ 9</Text>
              </View>
              <View className="flex flex-row items-center justify-between mb-8">
                <Text className="text-lg font-bold text-white">Total </Text>
                <Text className="text-lg font-bold text-white">£ 36</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Payment Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#02120A] px-5 py-4 border-t border-gray-700">
        <Pressable
          onPress={handleProceedToPayment}
          className="bg-[#FF3B30] rounded-2xl p-5 flex items-center justify-center"
        >
          <Text className="text-lg font-bold text-white">Proceed to Payment</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
