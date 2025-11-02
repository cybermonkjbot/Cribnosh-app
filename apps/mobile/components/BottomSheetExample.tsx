import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { BottomSheetBase } from './BottomSheetBase';

export function BottomSheetExample() {
  const colorScheme = useColorScheme();
  const [isOpen, setIsOpen] = useState(false);
  // Removed unused bottomSheetRef

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  // Callbacks
  const handlePresentModalPress = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setIsOpen(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: Colors[colorScheme as keyof typeof Colors].tint }
        ]}
        onPress={handlePresentModalPress}
      >
        <Text style={styles.buttonText}>Open Bottom Sheet</Text>
      </TouchableOpacity>

      {isOpen && (
        <BottomSheetBase
          snapPoints={snapPoints}
          index={1}
          onChange={handleSheetChanges}
          enablePanDownToClose={true}
        >
          <View style={styles.contentContainer}>
            <Text style={[
              styles.title,
              { color: Colors[colorScheme as keyof typeof Colors].text }
            ]}>
              Bottom Sheet Content
            </Text>
            <Text style={[
              styles.description,
              { color: Colors[colorScheme as keyof typeof Colors].text }
            ]}>
              This is an example of how to use the BottomSheetBase component.
              You can customize the snap points, styling, and content as needed.
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: Colors[colorScheme as keyof typeof Colors].tint }
              ]}
              onPress={handleDismiss}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetBase>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});

export default BottomSheetExample; 