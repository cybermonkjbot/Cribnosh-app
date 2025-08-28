import { SuperButton } from '@/components/ui/SuperButton';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnTheWayScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleCallDeliveryPerson = () => {
    // TODO: Implement call functionality
    console.log('Call delivery person');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FF3B30]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={handleBack}>
          <Feather name="chevron-left" size={24} color="white" />
        </Pressable>
        <View className="w-10 h-10 bg-white rounded-full" />
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6">
        {/* Order Coming Image */}
        <View className="items-center justify-center flex-1">
          <Image
            source={require("@/assets/images/ordercoming.png")}
            className="w-full h-[600px]"
            resizeMode="contain"
          />
        </View>

        {/* View Map Button - Above Delivery Driver Details */}
        <View className="absolute bottom-24 right-6">
          <Pressable
            onPress={() => console.log('View Map pressed')}
            className="bg-black bg-opacity-30 px-4 py-2 rounded-full"
          >
            <Text className="text-white text-sm font-medium">
              View Map
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Delivery Driver Info - Using SuperButton */}
      <SuperButton
        title={
          <View className="flex-row items-center justify-center w-full -mt-12">
            {/* Profile Picture with Red Ring */}
            <View className="relative mr-8">
              <View className="w-16 h-16 bg-gray-600 rounded-full items-center justify-center">
                <Text className="text-white text-xl font-bold">D</Text>
              </View>
              <View className="absolute -top-1 -right-1 w-18 h-18 border-4 border-[#FF3B30] rounded-full" />
            </View>

            {/* Driver Info */}
            <View className="flex-1">
              <Text className="text-[#E6FFE8] text-xl font-semibold mb-1 text-left">
                David Morel
              </Text>
              <Text className="text-white text-xs font-medium text-left">
                Delivering to you now
              </Text>
            </View>

            {/* Call Button */}
            <Pressable
              onPress={handleCallDeliveryPerson}
              className="w-14 h-14 bg-[#E6FFE8] rounded-full items-center justify-center ml-4"
            >
              <Feather name="phone" size={20} color="#094327" />
            </Pressable>
          </View>
        }
        onPress={() => {}} // No action on main button press
        backgroundColor="#02120A"
        textColor="white"
        style={{
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          height: 162,
          paddingHorizontal: 20,
          paddingTop: 20,
          bottom: -60, // Custom positioning for this screen only
        }}
      />
    </SafeAreaView>
  );
}
