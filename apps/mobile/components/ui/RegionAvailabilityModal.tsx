/**
 * Region Availability Modal Component
 * 
 * Displays an error modal when a user tries to order from an unsupported region.
 */

import { AlertCircle, Gift, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface RegionAvailabilityModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function RegionAvailabilityModal({
  isVisible,
  onClose,
}: RegionAvailabilityModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors] || Colors.light;
  const router = useRouter();

  const handleTreatSomeone = () => {
    onClose();
    router.push('/shared-ordering');
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeIconButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertCircle size={48} color="#EF4444" />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Oops, We do not serve this region yet
            </Text>

            <Text style={[styles.message, { color: colors.icon }]}>
              Ordering is not available in your region
            </Text>

            {/* Treat Someone Suggestion */}
            <View style={styles.suggestionContainer}>
              <Text style={[styles.suggestionText, { color: colors.icon }]}>
                You can still treat someone else in a supported region
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.treatButton, { backgroundColor: '#FF3B30' }]}
              onPress={handleTreatSomeone}
            >
              <Gift size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Treat Someone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.gotItButton, { backgroundColor: '#F3F4F6' }]}
              onPress={onClose}
            >
              <Text style={[styles.gotItButtonText]}>Got it</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeIconButton: {
    padding: 4,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Archivo',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  suggestionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: 8,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treatButton: {
    flexDirection: 'row',
    gap: 8,
  },
  gotItButton: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  gotItButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

