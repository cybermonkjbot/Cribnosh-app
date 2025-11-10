import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/convexApi';
import { Colors } from '../constants/Colors';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DocumentUpload, DocumentUploadRef } from '../components/DocumentUpload';
import { logger } from '../utils/Logger';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { VehicleTypePickerSheet } from '../components/VehicleTypePickerSheet';
import { VehicleModelPickerSheet } from '../components/VehicleModelPickerSheet';
import { VehicleYearPickerSheet } from '../components/VehicleYearPickerSheet';
import { BankPickerSheet } from '../components/BankPickerSheet';

export default function DriverRegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, sessionToken } = useDriverAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);
  // TODO: Replace with Cribnosh mutations/queries
  // const registerDriver = useMutation(api.mutations.drivers.registerDriver);
  const registerDriver = null; // Placeholder - may need to create endpoint
  
  // TODO: Replace with Cribnosh action/query
  // const verifyBankAccount = useAction(api.actions.banks.verifyBankAccount);
  const verifyBankAccount = null; // Placeholder - may need to create endpoint
  
  // Sheet visibility states
  const [showVehicleTypeSheet, setShowVehicleTypeSheet] = useState(false);
  const [showVehicleModelSheet, setShowVehicleModelSheet] = useState(false);
  const [showVehicleYearSheet, setShowVehicleYearSheet] = useState(false);
  const [showBankSheet, setShowBankSheet] = useState(false);
  
  // TODO: Replace with Cribnosh queries
  // Fetch suppliers for selection (may not exist in Cribnosh)
  // const suppliers = useQuery(api.queries.marketplace.getAllSuppliers);
  const suppliers = null; // Placeholder
  
  // TODO: Replace with Cribnosh queries
  // Fetch banks (may need to create endpoint)
  // const banks = useQuery(api.queries.banks.getBanks);
  const banks = null; // Placeholder
  
  // Store selected vehicle type ID and model ID
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState<string>('');
  const [selectedVehicleModelId, setSelectedVehicleModelId] = useState<string>('');
  
  // Document upload refs
  const driversLicenseRef = useRef<DocumentUploadRef>(null);
  const vehicleRegistrationRef = useRef<DocumentUploadRef>(null);
  const insuranceRef = useRef<DocumentUploadRef>(null);
  
  // Track file selections (not just uploads)
  const [hasSelectedFiles, setHasSelectedFiles] = useState({
    driversLicense: false,
    vehicleRegistration: false,
    insurance: false,
  });
  
  // Helper function to normalize phone number to +234 format
  const normalizePhoneNumber = (value: string): string => {
    if (!value) return '';
    // Remove all spaces, dashes, parentheses
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    
    // If it starts with +234, return as is
    if (cleaned.startsWith('+234')) {
      return cleaned;
    }
    
    // If it starts with 234 (without +), add +
    if (cleaned.startsWith('234')) {
      return '+' + cleaned;
    }
    
    // If it starts with 0 (local format), replace 0 with +234
    if (cleaned.startsWith('0')) {
      return '+234' + cleaned.substring(1);
    }
    
    // If it's 10 digits starting with 7, 8, or 9 (local format without 0), add +234
    if (/^[789]\d{9}$/.test(cleaned)) {
      return '+234' + cleaned;
    }
    
    return cleaned;
  };

  // Helper function to validate if a string is a phone number (not an email)
  const isValidPhoneNumber = (value: string): boolean => {
    if (!value) return false;
    // Check if it looks like an email (contains @)
    if (value.includes('@')) return false;
    
    // Normalize the phone number
    const normalized = normalizePhoneNumber(value);
    
    // Check if it matches phone number pattern after normalization
    // Nigerian phone numbers: +234 followed by 10 digits starting with 7, 8, or 9
    return /^\+234[789]\d{9}$/.test(normalized);
  };

  // Get prefill data from route params or user context
  // Only use phone number if it's actually a phone number (not an email)
  const getPrefilledPhoneNumber = (): string => {
    const paramPhone = params.phoneNumber as string;
    if (paramPhone && isValidPhoneNumber(paramPhone)) {
      // Normalize to +234 format
      return normalizePhoneNumber(paramPhone);
    }
    if (user?.phone && isValidPhoneNumber(user.phone)) {
      // Normalize to +234 format
      return normalizePhoneNumber(user.phone);
    }
    return '';
  };

  const prefilledPhoneNumber = getPrefilledPhoneNumber();
  const prefilledEmail = (params.email as string) || user?.email || '';
  
  // Determine which fields should be read-only (if we have data from backend)
  const hasBackendPhone = !!(user?.phone && isValidPhoneNumber(user.phone));
  const hasBackendEmail = !!user?.email;
  
  // Form data
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: user?.fullName?.split(' ')[0] || '',
    lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
    phoneNumber: prefilledPhoneNumber,
    email: prefilledEmail,
    
    // Vehicle Information
    vehicleType: '',
    vehicleModel: '',
    vehicleYear: '',
    licensePlate: '',
    
    // Documents
    driversLicense: '',
    vehicleRegistration: '',
    insurance: '',
    
    // Document file IDs
    driversLicenseFileId: '',
    vehicleRegistrationFileId: '',
    insuranceFileId: '',
    
    // Bank Information
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    
    // Work Type Selection
    workType: '', // 'independent' or 'supplier'
    supplierId: '',
  });

  // Fetch vehicle data for dropdowns (after formData is initialized)
  const vehicleTypes = useQuery(api.vehicles.getVehicleTypes);
  const vehicleModels = useQuery(
    api.vehicles.getVehicleModels,
    selectedVehicleTypeId 
      ? { vehicleTypeId: selectedVehicleTypeId as any }
      : "skip"
  );
  const vehicleYears = useQuery(api.vehicles.getVehicleYears);

  const steps = [
    { title: 'Personal Info', subtitle: 'Tell us about yourself' },
    { title: 'Vehicle Info', subtitle: 'Your delivery vehicle' },
    { title: 'Documents', subtitle: 'Required documents' },
    { title: 'Bank Details', subtitle: 'Payment information' },
    { title: 'Work Type', subtitle: 'Choose how you want to work' },
  ];

  const handleInputChange = (field: string, value: string) => {
    // Prevent editing read-only fields
    if (field === 'phoneNumber' && hasBackendPhone) {
      return; // Phone number is read-only if it comes from backend
    }
    if (field === 'email' && hasBackendEmail) {
      return; // Email is read-only if it comes from backend
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time phone number validation
    if (field === 'phoneNumber') {
      if (value.trim() === '') {
        setPhoneValidationError(null); // Clear error if field is empty
      } else if (!isValidPhoneNumber(value)) {
        setPhoneValidationError('Please enter a valid Nigerian phone number (e.g., +2348102414599 or 08102414599)');
      } else {
        setPhoneValidationError(null); // Clear error if valid
      }
    }
    
    // Auto-verify account when account number is entered and bank is selected
    if (field === 'accountNumber' && value.length === 10 && formData.bankCode) {
      handleAccountVerification(value, formData.bankCode);
    }
  };
  
  const handleBankSelect = (bankCode: string, bankName: string) => {
    setFormData(prev => ({ ...prev, bankCode, bankName }));
    
    // Auto-verify if account number is already 10 digits
    if (formData.accountNumber.length === 10) {
      handleAccountVerification(formData.accountNumber, bankCode);
    }
  };
  
  const handleAccountVerification = async (accountNumber: string, bankCode: string) => {
    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
      return;
    }
    
    setIsVerifyingAccount(true);
    try {
      const result = await verifyBankAccount({
        accountNumber,
        bankCode,
      });
      
      if (result.success && result.accountName) {
        setFormData(prev => ({ 
          ...prev, 
          accountName: result.accountName || '',
          accountNumber,
        }));
      } else {
        // Verification failed - clear account name and show error
        setFormData(prev => ({ 
          ...prev, 
          accountName: '',
        }));
        const errorMessage = result.error || 'Unable to verify account. Please check the account number and bank code.';
        Alert.alert('Verification Failed', errorMessage);
      }
    } catch (error) {
      logger.error('Account verification error:', error);
      // Clear account name on error
      setFormData(prev => ({ 
        ...prev, 
        accountName: '',
      }));
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify account. Please try again.';
      Alert.alert('Verification Error', errorMessage);
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  // Update form data when params or user data changes
  useEffect(() => {
    if (params.phoneNumber || params.email || user) {
      // Only update phone number if it's actually a phone number (not an email)
      const paramPhone = params.phoneNumber as string;
      const validParamPhone = paramPhone && isValidPhoneNumber(paramPhone) ? paramPhone : '';
      const validUserPhone = user?.phone && isValidPhoneNumber(user.phone) ? user.phone : '';
      
      // Recalculate backend flags inside useEffect
      const backendHasPhone = !!(user?.phone && isValidPhoneNumber(user.phone));
      const backendHasEmail = !!user?.email;
      
      setFormData(prev => {
        const newPhoneNumber = validParamPhone 
          ? normalizePhoneNumber(validParamPhone)
          : (backendHasPhone 
              ? prev.phoneNumber 
              : (validUserPhone ? normalizePhoneNumber(validUserPhone) : prev.phoneNumber));
        
        // Clear validation error if phone number is valid
        if (newPhoneNumber && isValidPhoneNumber(newPhoneNumber)) {
          setPhoneValidationError(null);
        }
        
        return {
          ...prev,
          // Only update phone if we have a valid phone number and it's not already set from backend
          // Normalize phone numbers to +234 format
          phoneNumber: newPhoneNumber,
          // Only update email if we have backend email and it's not already set
          email: params.email as string || (backendHasEmail ? (user?.email || prev.email) : prev.email),
          firstName: user?.fullName?.split(' ')[0] || prev.firstName || '',
          lastName: user?.fullName?.split(' ').slice(1).join(' ') || prev.lastName || '',
        };
      });
    }
  }, [params.phoneNumber, params.email, user]);

  const handleDocumentUpload = (documentType: 'driversLicense' | 'vehicleRegistration' | 'insurance', fileUrl: string, fileId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [`${documentType}FileId`]: fileId,
      [documentType]: fileUrl 
    }));
    // File is uploaded, update selection state
    setHasSelectedFiles(prev => ({ ...prev, [documentType]: false }));
  };

  const handleFileSelection = (documentType: 'driversLicense' | 'vehicleRegistration' | 'insurance', hasFile: boolean) => {
    setHasSelectedFiles(prev => ({ ...prev, [documentType]: hasFile }));
  };

  const handleUploadAll = async () => {
    const uploadPromises: Promise<{ success: boolean; documentType: string; error?: string }>[] = [];
    const documentTypes: string[] = [];
    
    if (driversLicenseRef.current?.hasSelectedFile()) {
      documentTypes.push("Driver's License");
      uploadPromises.push(
        driversLicenseRef.current.upload(true)
          .then(() => ({ success: true, documentType: "Driver's License" }))
          .catch(err => ({ success: false, documentType: "Driver's License", error: err.message || String(err) }))
      );
    }
    
    if (vehicleRegistrationRef.current?.hasSelectedFile()) {
      documentTypes.push("Vehicle Registration");
      uploadPromises.push(
        vehicleRegistrationRef.current.upload(true)
          .then(() => ({ success: true, documentType: "Vehicle Registration" }))
          .catch(err => ({ success: false, documentType: "Vehicle Registration", error: err.message || String(err) }))
      );
    }
    
    if (insuranceRef.current?.hasSelectedFile()) {
      documentTypes.push("Insurance");
      uploadPromises.push(
        insuranceRef.current.upload(true)
          .then(() => ({ success: true, documentType: "Insurance" }))
          .catch(err => ({ success: false, documentType: "Insurance", error: err.message || String(err) }))
      );
    }
    
    if (uploadPromises.length > 0) {
      const results = await Promise.all(uploadPromises);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        const failedDocs = failed.map(r => `${r.documentType}`).join(', ');
        Alert.alert('Upload Error', `Failed to upload: ${failedDocs}. Please try again.`);
      } else {
        // All successful - no alert needed, visual feedback is enough
      }
    }
  };

  const handleNext = async () => {
    // If on step 2 and button says "Upload All", upload all selected files first
    if (currentStep === 2 && !(formData.driversLicenseFileId && formData.vehicleRegistrationFileId && formData.insuranceFileId)) {
      await handleUploadAll();
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    // Personal info validation
    if (!formData.firstName.trim()) errors.push('First name is required');
    if (!formData.lastName.trim()) errors.push('Last name is required');
    if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
    if (!formData.email.trim()) errors.push('Email is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Phone validation - normalize phone number and validate
    if (formData.phoneNumber) {
      const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
      // Validate normalized phone number (must be +234 followed by 10 digits starting with 7, 8, or 9)
      if (!isValidPhoneNumber(formData.phoneNumber)) {
        errors.push('Please enter a valid Nigerian phone number');
      }
    }
    
    // Vehicle info validation
    if (!formData.vehicleType.trim()) errors.push('Vehicle type is required');
    if (!formData.vehicleModel.trim()) errors.push('Vehicle model is required');
    if (!formData.vehicleYear.trim()) errors.push('Vehicle year is required');
    if (!formData.licensePlate.trim()) errors.push('License plate is required');
    
    // Document validation
    if (!formData.driversLicenseFileId) errors.push('Driver\'s license is required');
    if (!formData.vehicleRegistrationFileId) errors.push('Vehicle registration is required');
    if (!formData.insuranceFileId) errors.push('Insurance certificate is required');
    
    // Bank info validation
    if (!formData.bankCode.trim()) errors.push('Bank selection is required');
    if (!formData.bankName.trim()) errors.push('Bank name is required');
    if (!formData.accountNumber.trim()) errors.push('Account number is required');
    if (formData.accountNumber && !/^\d{10}$/.test(formData.accountNumber)) {
      errors.push('Account number must be exactly 10 digits');
    }
    if (!formData.accountName.trim()) errors.push('Account name is required');
    
    // Work type validation
    if (!formData.workType) errors.push('Please select a work type');
    if (formData.workType === 'supplier' && !formData.supplierId) {
      errors.push('Please select a supplier');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert(
        'Validation Error',
        validationErrors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      // Normalize phone number to +234 format (handles local format like 08102414599)
      const normalizedPhoneNumber = normalizePhoneNumber(formData.phoneNumber);
      
      // Register driver using Convex
      // Pass session token if available so backend can identify existing user
      const result = await registerDriver({
        sessionToken: sessionToken || undefined,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: normalizedPhoneNumber,
        email: formData.email,
        vehicleType: formData.vehicleType,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear,
        licensePlate: formData.licensePlate,
        driversLicense: formData.driversLicense,
        vehicleRegistration: formData.vehicleRegistration,
        insurance: formData.insurance,
        bankName: formData.bankName,
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        supplierId: formData.workType === 'supplier' ? formData.supplierId : undefined,
      });
      
      if (result.success) {
        // Navigate to registration success screen
        router.push({
          pathname: '/registration-success',
          params: {
            driverId: result.driverId,
            userId: result.userId,
            },
        });
      } else {
        Alert.alert(
          'Registration Failed', 
          result.message || 'An error occurred during registration. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert(
        'Registration Failed', 
        `Failed to create your account: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.firstName && formData.lastName && formData.phoneNumber && 
               formData.email;
      case 1:
        return formData.vehicleType && formData.vehicleModel && 
               formData.vehicleYear && formData.licensePlate;
      case 2:
        // Enable button if all documents have either an uploaded file OR a selected file
        const hasDriversLicense = !!formData.driversLicenseFileId || hasSelectedFiles.driversLicense;
        const hasVehicleRegistration = !!formData.vehicleRegistrationFileId || hasSelectedFiles.vehicleRegistration;
        const hasInsurance = !!formData.insuranceFileId || hasSelectedFiles.insurance;
        return hasDriversLicense && hasVehicleRegistration && hasInsurance;
      case 3:
        return formData.bankCode && formData.bankName && formData.accountNumber && 
               formData.accountNumber.length === 10 && formData.accountName;
      case 4:
        return formData.workType && (formData.workType === 'independent' || formData.supplierId);
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your first name"
                placeholderTextColor={Colors.light.icon}
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your last name"
                placeholderTextColor={Colors.light.icon}
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  hasBackendPhone && styles.textInputDisabled,
                  phoneValidationError && styles.textInputError
                ]}
                placeholder="+234 800 000 0000"
                placeholderTextColor={Colors.light.icon}
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
                editable={!hasBackendPhone}
              />
              {phoneValidationError && (
                <Text style={styles.validationErrorText}>{phoneValidationError}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.textInput, hasBackendEmail && styles.textInputDisabled]}
                placeholder="Enter your email"
                placeholderTextColor={Colors.light.icon}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!hasBackendEmail}
              />
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Vehicle Type</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  if (!vehicleTypes || vehicleTypes.length === 0) {
                    Alert.alert('Error', 'Vehicle types are loading. Please wait.');
                    return;
                  }
                  setShowVehicleTypeSheet(true);
                }}
              >
                <Text style={[styles.selectButtonText, !formData.vehicleType && styles.placeholderText]}>
                  {formData.vehicleType || 'Select vehicle type'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Vehicle Model</Text>
              <TouchableOpacity
                style={[styles.selectButton, !formData.vehicleType && styles.selectButtonDisabled]}
                onPress={() => {
                  if (!formData.vehicleType) {
                    Alert.alert('Error', 'Please select a vehicle type first.');
                    return;
                  }
                  if (!vehicleModels || vehicleModels.length === 0) {
                    Alert.alert('Error', 'Vehicle models are loading. Please wait.');
                    return;
                  }
                  setShowVehicleModelSheet(true);
                }}
                disabled={!formData.vehicleType}
              >
                <Text style={[styles.selectButtonText, !formData.vehicleModel && styles.placeholderText]}>
                  {formData.vehicleModel || 'Select vehicle model'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Vehicle Year</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  if (!vehicleYears || vehicleYears.length === 0) {
                    Alert.alert('Error', 'Vehicle years are loading. Please wait.');
                    return;
                  }
                  setShowVehicleYearSheet(true);
                }}
              >
                <Text style={[styles.selectButtonText, !formData.vehicleYear && styles.placeholderText]}>
                  {formData.vehicleYear || 'Select vehicle year'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>License Plate</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ABC 123 DE"
                placeholderTextColor={Colors.light.icon}
                value={formData.licensePlate}
                onChangeText={(value) => handleInputChange('licensePlate', value)}
                autoCapitalize="characters"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Required Documents</Text>
            <Text style={styles.sectionSubtitle}>
              Please upload clear photos of the following documents
            </Text>

            <DocumentUpload
              ref={driversLicenseRef}
              documentType="driversLicense"
              onUploadComplete={(fileUrl, fileId) => handleDocumentUpload('driversLicense', fileUrl, fileId)}
              onUploadError={(error) => Alert.alert('Upload Error', error)}
              onFileSelected={(hasFile) => handleFileSelection('driversLicense', hasFile)}
              suppressAlerts={false}
            />

            <DocumentUpload
              ref={vehicleRegistrationRef}
              documentType="vehicleRegistration"
              onUploadComplete={(fileUrl, fileId) => handleDocumentUpload('vehicleRegistration', fileUrl, fileId)}
              onUploadError={(error) => Alert.alert('Upload Error', error)}
              onFileSelected={(hasFile) => handleFileSelection('vehicleRegistration', hasFile)}
              suppressAlerts={false}
            />

            <DocumentUpload
              ref={insuranceRef}
              documentType="insurance"
              onUploadComplete={(fileUrl, fileId) => handleDocumentUpload('insurance', fileUrl, fileId)}
              onUploadError={(error) => Alert.alert('Upload Error', error)}
              onFileSelected={(hasFile) => handleFileSelection('insurance', hasFile)}
              suppressAlerts={false}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Bank Information</Text>
            <Text style={styles.sectionSubtitle}>
              This is where your earnings will be deposited
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bank Name *</Text>
              <TouchableOpacity
                style={[styles.textInput, styles.selectButton]}
                onPress={() => setShowBankSheet(true)}
                accessible={true}
                accessibilityLabel="Select bank"
                accessibilityRole="button"
              >
                <Text style={formData.bankName ? styles.selectButtonText : styles.placeholderText}>
                  {formData.bankName || 'Select your bank'}
                </Text>
                <Ionicons name="chevron-down-outline" size={20} color={Colors.light.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0123456789"
                placeholderTextColor={Colors.light.icon}
                value={formData.accountNumber}
                onChangeText={(value) => {
                  // Only allow digits and limit to 10
                  const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
                  handleInputChange('accountNumber', digitsOnly);
                }}
                keyboardType="numeric"
                maxLength={10}
                editable={!isVerifyingAccount}
              />
              {isVerifyingAccount && (
                <View style={styles.verifyingIndicator}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.light.accent} />
                  <Text style={styles.verifyingText}>Verifying account...</Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Account Name *</Text>
              <TextInput
                style={[styles.textInput, formData.accountName ? {} : styles.textInputDisabled]}
                placeholder="Name on bank account"
                placeholderTextColor={Colors.light.icon}
                value={formData.accountName}
                onChangeText={(value) => handleInputChange('accountName', value)}
                editable={!!formData.accountName || !isVerifyingAccount}
                autoCapitalize="words"
              />
              {formData.accountName && !isVerifyingAccount && (
                <View style={styles.verifiedIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.light.accent} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            
            <BankPickerSheet
              visible={showBankSheet}
              onClose={() => setShowBankSheet(false)}
              banks={banks}
              selectedBankCode={formData.bankCode}
              onSelect={handleBankSelect}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>How Do You Want to Work?</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your preferred working arrangement
            </Text>

            {/* Independent Driver Option */}
            <TouchableOpacity
              style={[
                styles.workTypeCard,
                formData.workType === 'independent' && styles.selectedWorkTypeCard
              ]}
              onPress={() => {
                handleInputChange('workType', 'independent');
                handleInputChange('supplierId', ''); // Clear supplier selection
              }}
            >
              <View style={styles.workTypeIcon}>
                <Ionicons name="car-sport" size={32} color={Colors.light.primary} />
              </View>
              <View style={styles.workTypeInfo}>
                <Text style={styles.workTypeTitle}>Independent Driver</Text>
                <Text style={styles.workTypeDescription}>
                  Work with any supplier and accept orders from multiple companies. 
                  More flexibility and potentially higher earnings.
                </Text>
                <View style={styles.workTypeFeatures}>
                  <Text style={styles.featureText}>✓ Work with any supplier</Text>
                  <Text style={styles.featureText}>✓ Choose your own schedule</Text>
                  <Text style={styles.featureText}>✓ Higher earning potential</Text>
                </View>
              </View>
              <View style={styles.workTypeStatus}>
                <Ionicons 
                  name={formData.workType === 'independent' ? "radio-button-on" : "radio-button-off"} 
                  size={24} 
                  color={formData.workType === 'independent' ? Colors.light.primary : Colors.light.icon} 
                />
              </View>
            </TouchableOpacity>

            {/* Supplier-Specific Driver Option */}
            <TouchableOpacity
              style={[
                styles.workTypeCard,
                formData.workType === 'supplier' && styles.selectedWorkTypeCard
              ]}
              onPress={() => handleInputChange('workType', 'supplier')}
            >
              <View style={styles.workTypeIcon}>
                <Ionicons name="business" size={32} color={Colors.light.primary} />
              </View>
              <View style={styles.workTypeInfo}>
                <Text style={styles.workTypeTitle}>Supplier-Specific Driver</Text>
                <Text style={styles.workTypeDescription}>
                  Work exclusively with one supplier. More stable work and 
                  guaranteed orders from your chosen company.
                </Text>
                <View style={styles.workTypeFeatures}>
                  <Text style={styles.featureText}>✓ Stable work relationship</Text>
                  <Text style={styles.featureText}>✓ Guaranteed orders</Text>
                  <Text style={styles.featureText}>✓ Company benefits</Text>
                </View>
              </View>
              <View style={styles.workTypeStatus}>
                <Ionicons 
                  name={formData.workType === 'supplier' ? "radio-button-on" : "radio-button-off"} 
                  size={24} 
                  color={formData.workType === 'supplier' ? Colors.light.primary : Colors.light.icon} 
                />
              </View>
            </TouchableOpacity>

            {/* Supplier Selection (only show if supplier-specific is selected) */}
            {formData.workType === 'supplier' && (
              <View style={styles.supplierSelectionContainer}>
                <Text style={styles.supplierSelectionTitle}>Choose Your Supplier</Text>
                <Text style={styles.supplierSelectionSubtitle}>
                  Select your delivery preferences
                </Text>

                {suppliers?.map((supplier: Supplier) => (
                  <TouchableOpacity
                    key={supplier._id}
                    style={[
                      styles.supplierCard,
                      formData.supplierId === supplier._id && styles.selectedSupplierCard
                    ]}
                    onPress={() => handleInputChange('supplierId', supplier._id)}
                  >
                    <View style={styles.supplierInfo}>
                      <Text style={styles.supplierName}>{supplier.companyName}</Text>
                      <Text style={styles.supplierAddress}>{supplier.address}</Text>
                    </View>
                    <View style={styles.supplierStatus}>
                      <Ionicons 
                        name={formData.supplierId === supplier._id ? "radio-button-on" : "radio-button-off"} 
                        size={24} 
                        color={formData.supplierId === supplier._id ? Colors.light.primary : Colors.light.icon} 
                      />
                    </View>
                  </TouchableOpacity>
                ))}

                {!suppliers && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading suppliers...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/depictions/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        {/* Step Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading ? 'Creating Account...' : 
               currentStep === steps.length - 1 ? 'Create Account' :
               currentStep === 2 && !(formData.driversLicenseFileId && formData.vehicleRegistrationFileId && formData.insuranceFileId) ? 'Upload All' : 
               'Continue'}
            </Text>
            {!isLoading && <Ionicons name="arrow-forward" size={20} color={Colors.light.background} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehicle Type Picker Sheet */}
      <VehicleTypePickerSheet
        visible={showVehicleTypeSheet}
        onClose={() => setShowVehicleTypeSheet(false)}
        types={vehicleTypes}
        selectedTypeId={selectedVehicleTypeId}
        onSelect={(typeId, typeName) => {
          setSelectedVehicleTypeId(typeId);
          handleInputChange('vehicleType', typeName);
          // Clear model selection when type changes
          setSelectedVehicleModelId('');
          handleInputChange('vehicleModel', '');
          setShowVehicleTypeSheet(false);
        }}
      />

      {/* Vehicle Model Picker Sheet */}
      <VehicleModelPickerSheet
        visible={showVehicleModelSheet}
        onClose={() => setShowVehicleModelSheet(false)}
        models={vehicleModels}
        selectedModelId={selectedVehicleModelId}
        onSelect={(modelId, modelName) => {
          setSelectedVehicleModelId(modelId);
          handleInputChange('vehicleModel', modelName);
          setShowVehicleModelSheet(false);
        }}
      />

      {/* Vehicle Year Picker Sheet */}
      <VehicleYearPickerSheet
        visible={showVehicleYearSheet}
        onClose={() => setShowVehicleYearSheet(false)}
        years={vehicleYears}
        selectedYear={formData.vehicleYear}
        onSelect={(year) => {
          handleInputChange('vehicleYear', year);
          setShowVehicleYearSheet(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
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
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 32,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.secondary,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  textInputError: {
    borderColor: Colors.light.error,
    borderWidth: 2,
  },
  validationErrorText: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 4,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  selectButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    color: Colors.light.icon,
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  textInputDisabled: {
    backgroundColor: Colors.light.surface,
    color: Colors.light.text,
    opacity: 0.7,
  },
  verifyingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  verifyingText: {
    fontSize: 12,
    color: Colors.light.accent,
  },
  verifiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.light.accent,
    fontWeight: '600',
  },
  selectButtonDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.light.surface,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 24,
  },
  documentContainer: {
    marginBottom: 16,
  },
  documentButton: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    borderStyle: 'dashed',
  },
  documentText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  documentSubtext: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  footer: {
    paddingVertical: 24,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 20,
  },
  supplierCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.secondary,
  },
  selectedSupplierCard: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  supplierAddress: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  supplierStatus: {
    marginLeft: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  workTypeCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: Colors.light.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedWorkTypeCard: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  workTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workTypeInfo: {
    flex: 1,
    marginRight: 12,
  },
  workTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.light.text,
  },
  workTypeDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
    marginBottom: 12,
  },
  workTypeFeatures: {
    gap: 4,
  },
  featureText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '500',
  },
  workTypeStatus: {
    marginTop: 4,
  },
  supplierSelectionContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.secondary,
  },
  supplierSelectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.light.text,
  },
  supplierSelectionSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 16,
  },
});
