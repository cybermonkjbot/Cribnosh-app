import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SessionExpiredModalProps {
  isVisible: boolean;
  onRelogin: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isVisible,
  onRelogin,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={48} color="#FF3B30" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Session Expired</Text>

          {/* Message */}
          <Text style={styles.message}>
            Your session has expired for security reasons. Please sign in again to continue using the app.
          </Text>

          {/* Relogin Button */}
          <TouchableOpacity
            style={styles.reloginButton}
            onPress={onRelogin}
            activeOpacity={0.8}
          >
            <Text style={styles.reloginButtonText}>Sign In Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Urbanist',
    fontSize: 24,
    fontWeight: '700',
    color: '#094327',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  reloginButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  reloginButtonText: {
    fontFamily: 'Urbanist',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

