import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { TakeawayCategoryDrawer } from './TakeawayCategoryDrawer';
import { TooFreshToWasteDrawer } from './TooFreshToWasteDrawer';

type DrawerType = 'takeaway' | 'tooFresh' | 'custom' | null;

export function CategoryDrawerDemo() {
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
  };

  const handleAddToCart = (id: string) => {
    console.log('Added to cart:', id);
  };

  const handleItemPress = (id: string) => {
    console.log('Item pressed:', id);
  };

  const renderDrawer = () => {
    switch (activeDrawer) {
      case 'takeaway':
        return (
          <TakeawayCategoryDrawer
            categoryName="All Available Takeaway's"
            onBack={handleCloseDrawer}
            onAddToCart={handleAddToCart}
            onItemPress={handleItemPress}
          />
        );
      case 'tooFresh':
        return (
          <TooFreshToWasteDrawer
            onBack={handleCloseDrawer}
            onAddToCart={handleAddToCart}
            onItemPress={handleItemPress}
          />
        );
      case 'custom':
        return (
          <CategoryFullDrawer
            categoryName="Custom Category"
            categoryDescription="This is a custom category with special content"
            onBack={handleCloseDrawer}
            filterChips={[
              { id: 'option1', label: 'Option 1' },
              { id: 'option2', label: 'Option 2' },
              { id: 'option3', label: 'Option 3' },
            ]}
            activeFilters={[]}
          >
            <View style={styles.customContent}>
              <Text style={styles.customText}>
                This is a custom category drawer with your own content!
              </Text>
            </View>
          </CategoryFullDrawer>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Demo Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => setActiveDrawer('takeaway')}
        >
          <Text style={styles.buttonText}>Show Takeaway Drawer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => setActiveDrawer('tooFresh')}
        >
          <Text style={styles.buttonText}>Show Too Fresh Drawer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => setActiveDrawer('custom')}
        >
          <Text style={styles.buttonText}>Show Custom Drawer</Text>
        </TouchableOpacity>
      </View>

      {/* Drawer Modal */}
      <Modal
        visible={activeDrawer !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseDrawer}
      >
        {renderDrawer()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  buttonContainer: {
    gap: 16,
    padding: 20,
  },
  demoButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customText: {
    fontSize: 18,
    color: '#094327',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 