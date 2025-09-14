import { Entypo } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OnTheWayDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

const OnTheWay: React.FC<OnTheWayDrawerProps> = ({ isVisible, onClose }) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1">
          {/* Header */}
          <View className="flex flex-row items-center justify-between w-full bg-white px-5 py-4 border-b border-gray-200">
            <Pressable onPress={onClose}>
              <Entypo name="chevron-down" size={24} color="#094327" />
            </Pressable>
            <Text className="text-lg font-semibold text-center text-dark-green">
              Order Confirmed
            </Text>
            <View className="w-6" />
          </View>

          {/* Content */}
          <View className="flex-1 items-center justify-center px-8">
            <View className="items-center">
              <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
                <Entypo name="check" size={48} color="#10B981" />
              </View>
              
              <Text className="text-2xl font-bold text-center text-gray-900 mb-4">
                Your order is on the way!
              </Text>
              
              <Text className="text-lg text-center text-gray-600 mb-8 leading-6">
                We've received your order and our kitchen is preparing it now. 
                You'll receive updates as your food makes its way to you.
              </Text>

              <View className="bg-gray-50 rounded-2xl p-6 w-full mb-6">
                <Text className="text-lg font-semibold text-center text-gray-900 mb-3">
                  Estimated Delivery
                </Text>
                <Text className="text-3xl font-bold text-center text-dark-green">
                  38-64 mins
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                className="bg-[#FF3B30] rounded-2xl p-5 w-full items-center"
              >
                <Text className="text-lg font-bold text-white">Track Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default OnTheWay;
