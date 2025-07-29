import { CartButton } from '@/components/ui/CartButton';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CartButtonDemo() {
  const [quantity, setQuantity] = useState(2);

  const handleAddToCart = () => {
    setQuantity(prev => prev + 1);
    Alert.alert('Success', 'Item added to cart!');
  };

  const handleViewCart = () => {
    Alert.alert('Cart', `You have ${quantity} items in your cart`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>CartButton Component Demo</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add to Cart Variant</Text>
          <Text style={styles.description}>
            This variant is used for adding items to cart. It has a floating container with safe area support.
          </Text>
          
          <View style={styles.buttonContainer}>
            <CartButton
              quantity={quantity}
              onPress={handleAddToCart}
              variant="add"
              position="relative"
              buttonText="Add to Cart"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>View Cart Variant</Text>
          <Text style={styles.description}>
            This variant is used for viewing cart contents. It includes a shopping bag icon.
          </Text>
          
          <View style={styles.buttonContainer}>
            <CartButton
              quantity={quantity}
              onPress={handleViewCart}
              variant="view"
              position="relative"
              buttonText="Items in cart"
              showIcon={true}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Styling</Text>
          <Text style={styles.description}>
            The CartButton supports custom colors and styling.
          </Text>
          
          <View style={styles.buttonContainer}>
            <CartButton
              quantity={quantity}
              onPress={handleViewCart}
              variant="view"
              position="relative"
              backgroundColor="#4CAF50"
              textColor="#FFFFFF"
              quantityBadgeColor="#FFFFFF"
              quantityTextColor="#4CAF50"
              buttonText="Custom Style"
              showIcon={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Absolute Positioning</Text>
          <Text style={styles.description}>
            The CartButton can be positioned absolutely within a container.
          </Text>
          
          <View style={styles.absoluteContainer}>
            <Text style={styles.placeholderText}>Container with absolute positioned button</Text>
            <CartButton
              quantity={quantity}
              onPress={handleViewCart}
              variant="view"
              position="absolute"
              bottom={20}
              left={20}
              right={20}
              buttonText="Absolute Position"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 40,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  absoluteContainer: {
    height: 200,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
  },
}); 