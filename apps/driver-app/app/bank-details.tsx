import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { useUpdateDriverProfileMutation } from '../store/driverApi';

export default function BankDetailsScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    bankName: driver?.bankName || '',
    accountNumber: driver?.accountNumber || '',
    accountName: driver?.accountName || '',
  });

  const [updateDriverProfile, { isLoading: isUpdating }] = useUpdateDriverProfileMutation();

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!driver) return;

    // Validate form
    if (!formData.bankName.trim()) {
      Alert.alert('Error', 'Please enter bank name');
      return;
    }
    if (!formData.accountNumber.trim()) {
      Alert.alert('Error', 'Please enter account number');
      return;
    }
    if (!formData.accountName.trim()) {
      Alert.alert('Error', 'Please enter account name');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateDriverProfile({
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
      }).unwrap();

      if (result.success) {
        Alert.alert('Success', 'Bank details updated successfully!');
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to update bank details');
      }
    } catch (error: any) {
      console.error('Bank details update error:', error);
      const errorMessage = error?.data?.error?.message || error?.message || 'Failed to update bank details. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Bank Details</ThemedText>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          <ThemedText style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Bank Account Information</ThemedText>
          <ThemedText style={styles.description}>
            Update your bank account details for receiving payments and payouts.
          </ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Bank Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.bankName}
              onChangeText={(value) => updateField('bankName', value)}
              placeholder="e.g., Access Bank, GTBank, First Bank"
              placeholderTextColor={Colors.light.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Account Number *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.accountNumber}
              onChangeText={(value) => updateField('accountNumber', value)}
              placeholder="Enter your account number"
              placeholderTextColor={Colors.light.icon}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Account Name *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.accountName}
              onChangeText={(value) => updateField('accountName', value)}
              placeholder="Enter account holder name"
              placeholderTextColor={Colors.light.icon}
            />
          </View>
        </ThemedView>

        {/* Security Notice */}
        <ThemedView style={styles.noticeSection}>
          <View style={styles.noticeHeader}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.light.accent} />
            <ThemedText style={styles.noticeTitle}>Security Notice</ThemedText>
          </View>
          <ThemedText style={styles.noticeText}>
            Your bank details are encrypted and stored securely. We only use this information to process your payments and payouts.
          </ThemedText>
        </ThemedView>

        {/* Help Section */}
        <ThemedView style={styles.helpSection}>
          <View style={styles.helpHeader}>
            <Ionicons name="help-circle" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.helpTitle}>Need Help?</ThemedText>
          </View>
          <ThemedText style={styles.helpText}>
            If you're having trouble finding your account details, check your bank statement or contact your bank directly.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  noticeSection: {
    backgroundColor: Colors.light.accent + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.accent,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.accent,
    marginLeft: 8,
  },
  noticeText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  helpSection: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
