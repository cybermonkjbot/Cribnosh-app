import React from 'react';
import { Image, Text, View } from 'react-native';
import OrderItemCounterButton from './OrderItemCounterButton';

interface CompactMealSelectionProps {
  title?: string;
  price?: string;
  imageSource?: any;
  onChange?: (value: number) => void;
}

const CompactMealSelection: React.FC<CompactMealSelectionProps> = ({
  title = 'Creamy Soup',
  price = '16 QR',
  imageSource = require('../assets/images/cribnoshpackaging.png'),
  onChange,
}) => {
  return (
    <View className="flex-row items-center bg-white rounded-2xl shadow-sm p-2 gap-2 w-full min-w-0 flex-1 self-stretch">
      {/* Image Section */}
      <View className="w-[72px] h-[72px] justify-center items-center mr-2 relative overflow-hidden rounded-xl">
        <View className="absolute w-full h-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl z-10" />
        <Image source={imageSource} className="w-full h-full" resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0 }} />
      </View>
      {/* Info Section */}
      <View className="flex-1 justify-center ml-2 min-w-0">
        <Text className="font-inter font-normal text-[16px] leading-6 text-black h-6" numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        <Text className="font-inter font-bold text-[16px] leading-6 text-black h-6 mt-1">{price}</Text>
      </View>
      {/* Counter Section */}
      <View className="w-[79px] h-9 justify-center items-center ml-2">
        <OrderItemCounterButton onChange={onChange} />
      </View>
    </View>
  );
};



export default CompactMealSelection;
