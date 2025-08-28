import { KitchenNameCard } from '@/components/KitchenNameCard';
import { SuperButton } from '@/components/ui/SuperButton';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuccessScreen() {
  const handleBackToHome = () => {
    router.replace("/(tabs)");
  };

  const handleTrackOrder = () => {
    router.push("/orders/cart/on-the-way");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FF3B30]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={handleBackToHome}>
          <Feather name="chevron-left" size={24} color="white" />
        </Pressable>
        <View className="w-10 h-10 bg-white rounded-full" />
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6">
        {/* Order Confirmation Image */}
        <View className="items-center mb-8">
          <Image
            source={require("@/assets/images/order-confirmation.png")}
            className="w-full h-64 -ml-20"
            resizeMode="contain"
          />
        </View>

        {/* Delivery Details */}
        <View className="w-full space-y-20 relative">
          {/* Progress Dots - positioned absolutely on the left between icons */}
          <View className="absolute left-3 top-24 flex flex-col items-center space-y-4">
            <View className="w-1 h-1 bg-white rounded-full opacity-25" />
            <View className="w-1.5 h-1.5 bg-white rounded-full opacity-50" />
            <View className="w-1.5 h-1.5 bg-white rounded-full opacity-75" />
          </View>

          {/* Delivery Time */}
          <View className="flex flex-row items-center gap-2.5">
            <View className="w-6 h-6 bg-[#094327] rounded-full items-center justify-center">
              <Feather name="clock" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-normal mb-2">
                Your delivery time
              </Text>
              <Text className="text-[#094327] text-lg font-semibold">
                15 - 45 minutes
              </Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View className="flex flex-row items-center gap-2.5">
            <View className="w-6 h-6 bg-[#094327] rounded-full items-center justify-center">
              <Feather name="map-pin" size={16} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-normal mb-2">
                Your address
              </Text>
              <Text className="text-[#094327] text-lg font-semibold">
                Wisteria st 30, Houston, TX
              </Text>
            </View>
          </View>
        </View>

        {/* Kitchen Information Card */}
        <View className="mt-8 mb-6">
          <KitchenNameCard 
            name="Stans Kitchen"
            description="African cuisine (Top Rated)"
            tiltEnabled={false}
          />
        </View>

        {/* Track Order Button - positioned above the super button */}
        <View className="absolute bottom-12 left-6 right-6">
          <Pressable
            onPress={handleTrackOrder}
            className="bg-white py-4 px-6 rounded-2xl items-center"
          >
            <Text className="text-[#FF3B30] text-lg font-semibold">
              Track Order
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Super Button - Start New Order */}
      <SuperButton
        title="Start New Order"
        onPress={handleBackToHome}
        backgroundColor="#094327"
        textColor="white"
      />
    </SafeAreaView>
  );
}
