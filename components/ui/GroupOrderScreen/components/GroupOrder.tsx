import React, { useRef, useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ArrowBigDownIcon, ArrowDownIcon, ChevronDown } from 'lucide-react-native';

type GroupOrderProps = {
    handleOpenSheet?: () => void;
    handleCloseSheet?: () => void;
    isOpen?: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}
export default function GroupOrder({handleCloseSheet, handleOpenSheet, isOpen, setIsOpen}: GroupOrderProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '100%', '100%'], []);
//   const [isOpen, setIsOpen] = useState(false);

//   const handleOpenSheet = () => {
//     setIsOpen(true);
//     bottomSheetRef.current?.expand();
//   };

//   const handleCloseSheet = () => {
//     setIsOpen(false);
//     bottomSheetRef.current?.close();
//   };

//   const handleSheetChange = useCallback((index) => {
//     if (index === -1) setIsOpen(false);
//   }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container}>
          <TouchableOpacity onPress={handleOpenSheet} style={styles.button}>
            <Text style={styles.buttonText}>Open Bottom Sheet</Text>
          </TouchableOpacity>

          {isOpen && (
            <BottomSheet
              ref={bottomSheetRef}
              index={1}
              snapPoints={snapPoints}
            //   onChange={handleSheetChange}
              enablePanDownToClose={true}
            //   style={{ backgroundColor: '#02120A' }}
            >
              <View style={styles.sheetContent}>
                <View className='flex flex-row items-center justify-between w-full mb-4'>
                    <ChevronDown color="#E6FFE8" />
                    <Text style={{color:'#E6FFE8'}}>Share</Text>
                </View>
                <View>
                    <Text style={ {backgroundColor: '#FF3B30', color: 'white', padding: 8 }}>Josh  and  friend’s party order</Text>
                </View>
               
              </View>
            </BottomSheet>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#02120A',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#007bff',
    borderRadius: 6,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    // fontSize: 16,
  },
});
