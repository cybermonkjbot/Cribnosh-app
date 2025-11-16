/**
 * Update Available Modal Component
 * 
 * Displays a modal when a new app update is available, asking the user if they want to update now.
 */

import { Mascot } from '@/components/Mascot';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface UpdateAvailableModalProps {
  isVisible: boolean;
  onUpdate: () => void;
  onLater: () => void;
}

export function UpdateAvailableModal({
  isVisible,
  onUpdate,
  onLater,
}: UpdateAvailableModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors] || Colors.light;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onLater}
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

            <Text style={[styles.title, { color: colors.text }]}>
              Update Available
            </Text>

            <Text style={[styles.message, { color: colors.icon }]}>
              A new version of the app is available. Would you like to update now? The app will restart to apply the update.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={onUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textButton}
              onPress={onLater}
              activeOpacity={0.7}
            >
              <Text style={styles.textButtonText}>Later</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 12,
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
  updateButton: {
    backgroundColor: '#FF3B30',
  },
  updateButtonText: {
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

