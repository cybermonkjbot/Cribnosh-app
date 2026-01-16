import { api } from '@/convex/_generated/api';
import { CustomerAddress } from '@/types/customer';
import { useAction } from 'convex/react';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface AddressFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (address: CustomerAddress & { labelName?: string }) => void;
  initialAddress?: CustomerAddress & { labelName?: string };
  label?: 'home' | 'work' | 'custom';
}

export function AddressFormModal({
  isVisible,
  onClose,
  onSave,
  initialAddress,
  label = 'custom',
}: AddressFormModalProps) {
  const [formData, setFormData] = useState({
    labelName: initialAddress?.labelName || '',
    street: initialAddress?.street || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postal_code: initialAddress?.postal_code || '',
    country: initialAddress?.country || 'United Kingdom',
  });

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string; skipped?: boolean } | null>(null);
  const validateAddressAction = useAction(api.actions.stuart.validateDeliveryAddress);

  const validateAddress = async () => {
    if (!formData.street || !formData.city || !formData.postal_code) return;

    setIsValidating(true);
    setValidationResult(null);
    try {
      const fullAddress = `${formData.street}, ${formData.city}, ${formData.postal_code}, ${formData.country}`;
      const result = await validateAddressAction({ address: fullAddress });
      setValidationResult(result);
    } catch (error) {
      console.error('Stuart validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (initialAddress) {
      setFormData({
        labelName: initialAddress.labelName || '',
        street: initialAddress.street || '',
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        postal_code: initialAddress.postal_code || '',
        country: initialAddress.country || 'United Kingdom',
      });
    } else {
      setFormData({
        labelName: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'United Kingdom',
      });
    }
  }, [initialAddress, isVisible]);

  const handleSave = () => {
    // Validate required fields
    if (!formData.street.trim()) {
      Alert.alert('Error', 'Please enter a street address');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'Please enter a state/region');
      return;
    }
    if (!formData.postal_code.trim()) {
      Alert.alert('Error', 'Please enter a postal code');
      return;
    }
    if (!formData.country.trim()) {
      Alert.alert('Error', 'Please enter a country');
      return;
    }

    const address: CustomerAddress & { labelName?: string } = {
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postal_code: formData.postal_code.trim(),
      country: formData.country.trim(),
      ...(formData.labelName && { labelName: formData.labelName.trim() }),
    };

    onSave(address);
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {initialAddress
                ? `Edit ${label === 'home' ? 'home' : label === 'work' ? 'work' : ''} address`.trim()
                : label === 'custom'
                  ? 'Add address'
                  : `Add ${label === 'home' ? 'home' : 'work'} address`}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Label Name (for custom addresses) */}
            {label === 'custom' && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Label (optional)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mum's House, Gym"
                  placeholderTextColor="#9CA3AF"
                  value={formData.labelName}
                  onChangeText={(value) => updateField('labelName', value)}
                />
              </View>
            )}

            {/* Street Address */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Street Address *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                placeholderTextColor="#9CA3AF"
                value={formData.street}
                onChangeText={(value) => updateField('street', value)}
                onBlur={validateAddress}
                autoCapitalize="words"
              />
            </View>

            {/* City and State */}
            <View style={styles.row}>
              <View style={[styles.fieldContainer, styles.halfWidth]}>
                <Text style={styles.label}>
                  City *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  value={formData.city}
                  onChangeText={(value) => updateField('city', value)}
                  onBlur={validateAddress}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.fieldContainer, styles.halfWidth]}>
                <Text style={styles.label}>
                  State/Region *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                  value={formData.state}
                  onChangeText={(value) => updateField('state', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Postal Code and Country */}
            <View style={styles.row}>
              <View style={[styles.fieldContainer, styles.halfWidth]}>
                <Text style={styles.label}>
                  Postal Code *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Postal Code"
                  placeholderTextColor="#9CA3AF"
                  value={formData.postal_code}
                  onChangeText={(value) => updateField('postal_code', value)}
                  onBlur={validateAddress}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.fieldContainer, styles.halfWidth]}>
                <Text style={styles.label}>
                  Country *
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  placeholderTextColor="#9CA3AF"
                  value={formData.country}
                  onChangeText={(value) => updateField('country', value)}
                  onBlur={validateAddress}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Validation Indicator */}
            {isValidating && (
              <View style={styles.validationContainer}>
                <ActivityIndicator size="small" color="#6B7280" />
                <Text style={styles.validationText}>Checking delivery coverage...</Text>
              </View>
            )}

            {validationResult && !isValidating && (
              <View style={styles.validationContainer}>
                <Text style={[
                  styles.validationText,
                  { color: validationResult.valid ? '#10B981' : '#F59E0B' }
                ]}>
                  {validationResult.valid
                    ? (validationResult.skipped ? "" : "✓ Address is within delivery range")
                    : `⚠️ ${validationResult.error || "Possibly outside delivery range"}`
                  }
                </Text>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: '#FF3B30' }]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Save Address</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '90%',
    minHeight: '70%',
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 24,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
});

