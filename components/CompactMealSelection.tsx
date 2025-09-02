import React, { useState } from 'react';
import { Image, Text, View, Dimensions } from 'react-native';
import { TiltCard } from './ui/TiltCard';
import IncrementalOrderAmount from './IncrementalOrderAmount';

interface CompactMealSelectionProps {
  title?: string;
  price?: string;
  imageSource?: any; // local require() or URL string
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
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth * 0.18; // ~18% of screen width for thumbnail

  const resolvedSource =
    typeof imageSource === 'string' ? { uri: imageSource } : imageSource;

  const [quantity, setQuantity] = useState(1);

  const cardContent = (
    <View className="flex-row items-center bg-white rounded-2xl shadow-sm p-3 w-full self-stretch">
      {/* Image Section */}
      <View
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: 12,
          overflow: 'hidden',
          marginRight: 12,
        }}
      >
        <Image
          source={resolvedSource}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

      {/* Info Section */}
      <View className="flex-1 justify-center min-w-0 mr-3">
        <Text
          className="font-inter font-normal text-base text-black"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <Text className="font-inter font-bold text-base text-black mt-1">
          {price}
        </Text>
      </View>

      {/* Counter Section */}
      <IncrementalOrderAmount
        initialValue={quantity}
        min={1}
        max={99}
        onChange={(newQuantity) => {
          setQuantity(newQuantity);
          onChange?.(newQuantity);
        }}
      />
    </View>
  );

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
