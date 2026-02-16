import AmountInput from '@/components/AmountInput'
import BottomSheet from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { useMemo, useRef } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Button } from '../../Button'

import { CartButton } from '../../CartButton'

type GroupOrderCheckoutProps = {
  isSheetOpen?: boolean;
  onClose?: () => void;
  setIsSheetOpen?: (isOpen: boolean) => void;
}
const GroupOrderCheckout = ({ isSheetOpen, setIsSheetOpen, onClose }: GroupOrderCheckoutProps) => {

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '95%', '100%'], []);


  React.useEffect(() => {
    // sync imperative open/close (optional)
    if (isSheetOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close?.();
    }
  }, [isSheetOpen]);


  const handleSheetChange = (index: number) => {
    // user dragged sheet down to dismiss (gorhom uses -1 when closed)
    if (index === -1) {
      setIsSheetOpen!(false);
      // small delay so animation finishes; then navigate back
      setTimeout(() => {
        if (onClose) onClose();
        router.replace('/orders/group?openSheet=true'); // setIsOpen!(false)
      }, 0);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={styles.container}>

          {/* Modal */}

          {isSheetOpen && (
            <BottomSheet
              ref={bottomSheetRef}
              index={1}
              snapPoints={snapPoints}
              enablePanDownToClose
              onChange={handleSheetChange}
            >
              <ScrollView
                style={styles.sheetContent}
              >
                <View>
                  <Text
                    style={[
                      styles.title,
                      {
                        textShadowColor: '#FF3B30',
                        textShadowOffset: { width: 4, height: 1.5 },
                        textShadowRadius: 0.2,
                      }
                    ]}
                  >
                    Chip in an amount towards party order
                  </Text>
                  <Text style={{ color: '#EAEAEA', paddingTop: 10, paddingBottom: 20 }}>
                    Enter the amount you want to chip in, it’ll
                    go towards the total order cost
                  </Text>
                  <View >
                    <AmountInput amount='' setAmount={() => { }} />
                    <TouchableOpacity>

                      <Text style={styles.coverEverything}>
                        Cover everything
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
              <View style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#02120A',
                paddingVertical: 60,
                paddingHorizontal: 16,
                gap: 12,
              }}>
                <CartButton quantity={4} onPress={() => console.log('yes')} />
                <Button variant='danger' size='lg' >
                  <Text>Confirm</Text>
                </Button>

              </View>

            </BottomSheet>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default GroupOrderCheckout

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {
    flex: 1,
    // alignItems: 'center',
    // padding: 20,
    paddingHorizontal: 16,
    backgroundColor: '#02120A',
  },
  coverEverything: {
    color: '#fff',
    fontWeight: 400,
    fontSize: 14,
    backgroundColor: "#5E685F",
    textAlign: 'center',
    marginHorizontal: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 10
  },
  title: {
    color: '#FFFFFF', // text-white
    fontSize: 24, // text-2xl
    marginTop: 32, // mt-8
    fontWeight: '700', // font-bold
  },
})