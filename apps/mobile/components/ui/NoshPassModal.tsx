import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useToast } from '@/lib/ToastContext';
import { X } from 'lucide-react-native';

interface NoshPassModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyCode?: (code: string) => void;
  appliedCode?: string | null;
}

export function NoshPassModal({
  isVisible,
  onClose,
  onApplyCode,
  appliedCode,
}: NoshPassModalProps) {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const { showToast } = useToast();

  const handleApply = async () => {
    if (!code.trim()) {
      showToast({
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter a Nosh Pass code',
        duration: 2000,
      });
      return;
    }

    setIsApplying(true);
    try {
      // TODO: Validate and apply coupon code via API
      // For now, just call the callback
      if (onApplyCode) {
        await onApplyCode(code.trim().toUpperCase());
      }
      showToast({
        type: 'success',
        title: 'Code Applied',
        message: `Nosh Pass code "${code.trim().toUpperCase()}" applied successfully`,
        duration: 2000,
      });
      setCode('');
      onClose();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Invalid Code',
        message: error?.message || 'This code is invalid or has expired',
        duration: 3000,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemove = () => {
    if (onApplyCode) {
      onApplyCode('');
    }
    setCode('');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter Nosh Pass Code</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#111827" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.description}>
              Enter your Nosh Pass code to apply a discount to your order
            </Text>

            {appliedCode ? (
              <View style={styles.appliedCodeContainer}>
                <View style={styles.appliedCodeBadge}>
                  <Text style={styles.appliedCodeText}>{appliedCode}</Text>
                  <Pressable onPress={handleRemove} style={styles.removeButton}>
                    <X size={16} color="#094327" />
                  </Pressable>
                </View>
                <Text style={styles.appliedCodeLabel}>Code Applied</Text>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter code (e.g., EARLYBIRD)"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isApplying}
                />
              </View>
            )}

            {!appliedCode && (
              <Pressable
                style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
                onPress={handleApply}
                disabled={isApplying}
              >
                <Text style={styles.applyButtonText}>
                  {isApplying ? 'Applying...' : 'Apply Code'}
                </Text>
              </Pressable>
            )}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  applyButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appliedCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appliedCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#094327',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  appliedCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  appliedCodeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
});

