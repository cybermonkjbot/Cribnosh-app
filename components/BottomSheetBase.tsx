import { BottomSheet, BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  index?: number;
  onChange?: (index: number) => void;
  enablePanDownToClose?: boolean;
  backdropComponent?: React.FC<BottomSheetBackdropProps>;
  handleIndicatorStyle?: any;
  backgroundStyle?: any;
  containerStyle?: any;
}

export function BottomSheetBase({
  children,
  snapPoints = ['25%', '50%', '90%'],
  index = 0,
  onChange,
  enablePanDownToClose = true,
  backdropComponent,
  handleIndicatorStyle,
  backgroundStyle,
  containerStyle,
}: BottomSheetProps) {
  const colorScheme = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Memoize snap points to prevent unnecessary re-renders
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

  // Callbacks
  const handleSheetChanges = useCallback((index: number) => {
    onChange?.(index);
  }, [onChange]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    []
  );

  const defaultHandleIndicatorStyle = useMemo(() => [
    styles.handleIndicator,
    { backgroundColor: Colors[colorScheme as keyof typeof Colors].text },
    handleIndicatorStyle,
  ], [colorScheme, handleIndicatorStyle]);

  const defaultBackgroundStyle = useMemo(() => [
    styles.background,
    { backgroundColor: Colors[colorScheme as keyof typeof Colors].background },
    backgroundStyle,
  ], [colorScheme, backgroundStyle]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={index}
      snapPoints={memoizedSnapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={backdropComponent || renderBackdrop}
      handleIndicatorStyle={defaultHandleIndicatorStyle}
      backgroundStyle={defaultBackgroundStyle}
      containerStyle={containerStyle}
    >
      <BottomSheetView style={[styles.contentContainer, containerStyle]}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  background: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default BottomSheetBase; 