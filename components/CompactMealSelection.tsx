import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.container}>
      {/* Image Section */}
      <View style={styles.imageWrapper}>
        <View style={styles.imageBg} />
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      </View>
      {/* Info Section */}
      <View style={styles.infoWrapper}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
      {/* Counter Section */}
      <View style={styles.counterWrapper}>
        <OrderItemCounterButton onChange={onChange} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 347,
    height: 87,
    left: 19,
    top: 159,
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    position: 'absolute',
    width: 80.82,
    height: 77,
    left: 6,
    top: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBg: {
    position: 'absolute',
    width: 80.82,
    height: 77,
    backgroundColor: '#FAFAFA',
    borderColor: '#EAEAEA',
    borderWidth: 1,
    borderRadius: 15,
  },
  image: {
    position: 'absolute',
    width: 67,
    height: 67,
    left: 7,
    top: 7,
    borderRadius: 12,
  },
  infoWrapper: {
    position: 'absolute',
    left: 96,
    top: 16,
    width: 109,
    height: 52,
    justifyContent: 'flex-start',
  },
  title: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    height: 24,
  },
  price: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    height: 24,
    marginTop: 4,
  },
  counterWrapper: {
    position: 'absolute',
    left: 257,
    top: 16,
    width: 79,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CompactMealSelection;
