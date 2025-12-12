/**
 * Multiple Chefs Warning Modal Component
 * 
 * Displays a warning modal when a user tries to checkout with items from multiple food creators.
 */

import { useRouter } from 'expo-router';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Mascot } from '@/components/Mascot';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface MultipleChefsWarningModalProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MultipleChefsWarningModal({
  isVisible,
  onConfirm,
  onCancel,
}: MultipleChefsWarningModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors] || Colors.light;
  const router = useRouter();

  const handleGoBackToCart = () => {
    onCancel();
    router.back();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // Prevent dismissal via back button
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >

          {/* Content */}
          <View style={styles.content}>
            {/* Mascot */}
            <View style={styles.mascotContainer}>
              <Mascot emotion="default" size={140} />
            </View>

            <Text style={[styles.message, { color: colors.icon }]}>
              You&apos;re ordering from multiple food creators at the same time. Each food creator will prepare and deliver your order separately, which may result in different arrival times.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Continue with Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textButton}
              onPress={handleGoBackToCart}
              activeOpacity={0.7}
            >
              <Text style={styles.textButtonText}>Review Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    color: '#4B5563',
  },
  footer: {
    marginTop: 8,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  textButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#374151',
  },
});

