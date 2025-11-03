import type { FC, ReactNode } from 'react';
import { Modal as RNModal, StyleSheet, View } from 'react-native';
import { BlurEffect } from '@/utils/blurEffects';

export interface ModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
  glass?: boolean;
  elevated?: boolean;
}

export const Modal: FC<ModalProps> = ({ visible, onRequestClose, children, glass, elevated }) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  const innerStyle = [glass ? { position: 'relative' as const } : undefined];
  return (
    <RNModal
      visible={visible}
      onRequestClose={onRequestClose}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {hasGlass && (
          <BlurEffect
            intensity={30}
            tint="light"
            useGradient={true}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View
          style={[
            styles.container,
            hasGlass && styles.glass,
            hasElevation && !hasGlass && styles.shadow,
            { minWidth: 280 },
            ...innerStyle,
          ]}
        >
          {children}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  container: {
    marginHorizontal: 24, // mx-6
    borderRadius: 16, // rounded-2xl
    backgroundColor: '#FFFFFF', // bg-white
    padding: 24, // p-6
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // bg-white/60
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
});
