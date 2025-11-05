import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import IncrementalOrderAmount from './IncrementalOrderAmount';
import { TiltCard } from './ui/TiltCard';

interface CompactMealSelectionProps {
  title?: string;
  price?: string;
  imageSource?: any; // local require() or URL string
  onChange?: (quantity: number) => void;
  onOrder?: () => void;
  isOrdered?: boolean;
  tiltEnabled?: boolean;
}

const CompactMealSelection: React.FC<CompactMealSelectionProps> = ({
  title = 'Creamy Soup',
  price = '16 QR',
  imageSource = 'https://avatar.iran.liara.run/public/44',
  onChange,
  onOrder,
  isOrdered,
  tiltEnabled = true,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const imageSize = screenWidth * 0.18; // ~18% of screen width for thumbnail

  const resolvedSource =
    typeof imageSource === 'string' ? { uri: imageSource } : imageSource;

  const [quantity, setQuantity] = useState(1);

  const cardContent = (
    <View style={styles.container}>
      {/* Image Section */}
      <View
        style={[
          styles.imageContainer,
          {
          width: imageSize,
          height: imageSize,
          },
        ]}
      >
        <Image
          source={resolvedSource}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text
          style={styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <Text style={styles.price}>
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
        onOrder={onOrder}
        isOrdered={isOrdered}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 16, // rounded-2xl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    padding: 12, // p-3
    width: '100%', // w-full
    alignSelf: 'stretch', // self-stretch
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1, // flex-1
    justifyContent: 'center', // justify-center
    minWidth: 0, // min-w-0
    marginRight: 12, // mr-3
  },
  title: {
    fontFamily: 'Inter', // font-inter
    fontWeight: '400', // font-normal
    fontSize: 16, // text-base
    color: '#000000', // text-black
  },
  price: {
    fontFamily: 'Inter', // font-inter
    fontWeight: '700', // font-bold
    fontSize: 16, // text-base
    color: '#000000', // text-black
    marginTop: 4, // mt-1
  },
});

export default CompactMealSelection;
