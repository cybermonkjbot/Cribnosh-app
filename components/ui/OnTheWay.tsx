import { Entypo, Feather } from "@expo/vector-icons";
import { View } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, Text } from "react-native";

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
      <View className="flex-1 bg-red-500 pt-12 z-[99999] w-full">
        <View className="flex flex-row items-center justify-between w-full bg-black">
          <Pressable>
            <Entypo name="chevron-down" size={18} color="#094327" />
          </Pressable>
          <Text className="text-lg font-semibold text-center text-dark-green">
            My Cart
          </Text>
          <Pressable>
            <Feather name="trash-2" size={18} color="#094327" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default OnTheWay;
