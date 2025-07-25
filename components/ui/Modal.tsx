import { BlurView } from 'expo-blur';
import type { FC, ReactNode } from 'react';
import { Platform, Modal as RNModal, StyleSheet, View } from 'react-native';
import { cn } from './utils';

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
  const shadowClass = hasElevation && !hasGlass ? 'shadow-lg' : '';
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
        {hasGlass ? (
          Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          ) : Platform.OS === 'android' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(255,255,255,0.6)' }]} />
          )
        ) : null}
        <View
          className={cn('mx-6 rounded-2xl bg-white p-6', hasGlass && 'bg-white/60', shadowClass)}
          style={[{ minWidth: 280 }, ...innerStyle]}
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
});
