import React from 'react';
import { Image, Text, View } from 'react-native';
import OrderItemCounterButton from './OrderItemCounterButton';
import { TiltCard } from './ui/TiltCard';

interface CompactMealSelectionProps {
  title?: string;
  price?: string;
  imageSource?: any;
  onChange?: (quantity: number) => void;
  tiltEnabled?: boolean;
}

const CompactMealSelection: React.FC<CompactMealSelectionProps> = ({
  title = 'Creamy Soup',
  price = '16 QR',
  imageSource = 'https://avatar.iran.liara.run/public/44',
  onChange,
  tiltEnabled = true,
}) => {
  const cardContent = (
    <View className="flex-row items-center bg-white rounded-2xl shadow-sm p-2 gap-2 w-full min-w-0 flex-1 self-stretch">
      {/* Image Section */}
      <View className="w-[72px] h-[72px] justify-center items-center mr-2 relative overflow-hidden rounded-xl">
        <View className="absolute w-full h-full bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl z-10" />
        <Image src={imageSource}  className="w-full h-full" resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0 }} />
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

  // Wrap with TiltCard if enabled
  if (tiltEnabled) {
    return (
      <TiltCard
        intensity={5}
        enabled={tiltEnabled}
        springConfig={{
          damping: 22,
          stiffness: 190,
          mass: 0.65,
        }}
      >
        {cardContent}
      </TiltCard>
    );
  }

  return cardContent;
};

export default CompactMealSelection;
