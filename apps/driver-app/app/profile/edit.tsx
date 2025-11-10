import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/convexApi';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Linking,
  Pressable,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useDriverAuth } from '../../contexts/EnhancedDriverAuthContext';
import * as ImagePicker from 'expo-image-picker';

interface DocumentViewerProps {
  url: string;
  type: 'driversLicense' | 'vehicleRegistration' | 'insurance';
  onPress: () => void;
}

function DocumentViewer({ url, type, onPress }: DocumentViewerProps) {
  const [imageError, setImageError] = useState(false);
  
  // Check if URL is an image based on extension or content-type
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                  url.match(/image|jpg|jpeg|png|gif|webp/i);
  const isPDF = url.match(/\.pdf$/i) || url.match(/pdf/i);

  if (isImage && !imageError) {
    return (
      <Pressable onPress={onPress} style={styles.documentContainer}>
        <Image
          source={{ uri: url }}
          style={styles.documentImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
        <View style={styles.documentOverlay}>
          <View style={styles.documentInfo}>
            <Ionicons name="expand-outline" size={20} color={Colors.light.background} />
            <ThemedText style={styles.documentInfoText}>Tap to preview</ThemedText>
          </View>
        </View>
      </Pressable>
    );
  }

  if (isPDF) {
    return (
      <Pressable onPress={onPress} style={styles.documentContainer}>
        <View style={styles.pdfContainer}>
          <Ionicons name="document-text" size={48} color={Colors.light.primary} />
          <ThemedText style={styles.pdfText}>PDF Document</ThemedText>
          <ThemedText style={styles.pdfSubtext}>Tap to preview</ThemedText>
        </View>
      </Pressable>
    );
  }

  // Generic document viewer for other file types
  return (
    <Pressable onPress={onPress} style={styles.documentContainer}>
      <View style={styles.genericDocumentContainer}>
        <Ionicons name="document" size={48} color={Colors.light.primary} />
        <ThemedText style={styles.genericDocumentText}>Document</ThemedText>
        <ThemedText style={styles.genericDocumentSubtext}>Tap to preview</ThemedText>
      </View>
    </Pressable>
  );
}

interface DocumentPreviewModalProps {
  visible: boolean;
  url: string;
  type: 'driversLicense' | 'vehicleRegistration' | 'insurance';
  onClose: () => void;
}

function DocumentPreviewModal({ visible, url, type, onClose }: DocumentPreviewModalProps) {
  const screenDimensions = Dimensions.get('window');
  const [imageError, setImageError] = useState(false);
  
  // Check if URL is an image based on extension or content-type
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                  url.match(/image|jpg|jpeg|png|gif|webp/i);
  const isPDF = url.match(/\.pdf$/i) || url.match(/pdf/i);

  const getDocumentTitle = () => {
    switch (type) {
      case 'driversLicense':
        return "Driver's License";
      case 'vehicleRegistration':
        return 'Vehicle Registration';
      case 'insurance':
        return 'Insurance';
      default:
        return 'Document';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
            {getDocumentTitle()}
          </ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {isImage && !imageError ? (
            <ScrollView
              contentContainerStyle={styles.imageScrollContainer}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Image
                source={{ uri: url }}
                style={[
                  styles.previewImage,
                  {
                    width: screenDimensions.width,
                    height: screenDimensions.height * 0.7,
                  }
                ]}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            </ScrollView>
          ) : isPDF ? (
            <View style={styles.pdfPreviewContainer}>
              <View style={styles.pdfWebViewContainer}>
                <WebView
                  source={{ uri: url }}
                  style={styles.pdfWebView}
                  scalesPageToFit={true}
                  startInLoadingState={true}
                />
              </View>
            </View>
          ) : (
            <View style={styles.unsupportedContainer}>
              <Ionicons name="document-outline" size={64} color={Colors.light.icon} />
              <ThemedText style={styles.unsupportedText}>Preview not available</ThemedText>
              <ThemedText style={styles.unsupportedSubtext}>
                This document type cannot be previewed
              </ThemedText>
              <TouchableOpacity
                style={styles.openExternallyButton}
                onPress={() => Linking.openURL(url)}
              >
                <Ionicons name="open-outline" size={20} color={Colors.light.background} />
                <ThemedText style={styles.openExternallyText}>Open in Browser</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function DriverProfileEditScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState<'driversLicense' | 'vehicleRegistration' | 'insurance'>('driversLicense');
  
  // Fetch user data separately since driver only has userId reference
  const user = useQuery(api.auth.getUserById, driver?.userId ? { userId: driver.userId } : "skip");
  
  // Helper function to parse vehicle details from JSON string or use direct fields
  const parseVehicleData = (driver: any) => {
    let vehicleType = '';
    let vehicleModel = '';
    let vehicleYear = '';
    
    // Try to use direct fields first (if available)
    if (driver?.vehicleType) {
      vehicleType = driver.vehicleType;
    }
    if (driver?.vehicleModel) {
      vehicleModel = driver.vehicleModel;
    }
    if (driver?.vehicleYear) {
      vehicleYear = driver.vehicleYear;
    }
    
    // If not available, try parsing vehicleDetails JSON
    if (!vehicleType && driver?.vehicleDetails) {
      try {
        const vehicleInfo = JSON.parse(driver.vehicleDetails);
        vehicleType = vehicleInfo.vehicleType || '';
        vehicleModel = vehicleInfo.vehicleModel || '';
        vehicleYear = vehicleInfo.vehicleYear || '';
      } catch {
        // If parsing fails, vehicleDetails might be a plain string
        vehicleType = driver.vehicleDetails;
      }
    }
    
    return { vehicleType, vehicleModel, vehicleYear };
  };

  const [formData, setFormData] = useState({
    firstName: user?.fullName?.split(' ')[0] || '',
    lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    vehicleType: '',
    vehicleModel: '',
    vehicleYear: '',
    licensePlate: '',
    driversLicense: '',
    vehicleRegistration: '',
    insurance: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const updateDriverMutation = useMutation(api.drivers.updateDriverProfile);

  // Update form data when user data loads
  useEffect(() => {
    if (user && driver) {
      const vehicleData = parseVehicleData(driver);
      
      setFormData({
        firstName: user.fullName?.split(' ')[0] || '',
        lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        vehicleType: vehicleData.vehicleType,
        vehicleModel: vehicleData.vehicleModel,
        vehicleYear: vehicleData.vehicleYear,
        licensePlate: driver.licensePlate || '',
        driversLicense: driver.driversLicense || '',
        vehicleRegistration: driver.vehicleRegistration || '',
        insurance: driver.insurance || '',
        bankName: driver.bankName || '',
        accountNumber: driver.accountNumber || '',
        accountName: driver.accountName || '',
      });
    }
  }, [user, driver]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!driver) return;

    setIsLoading(true);
    try {
      const result = await updateDriverMutation({
        driverId: driver._id,
        updates: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          vehicleType: formData.vehicleType,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          licensePlate: formData.licensePlate,
          driversLicense: formData.driversLicense,
          vehicleRegistration: formData.vehicleRegistration,
          insurance: formData.insurance,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        }
      });

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
        <ThemedText type="title" style={styles.headerTitle}>Edit Profile</ThemedText>
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
        {/* Personal Information */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Personal Information</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>First Name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              placeholder="Enter first name"
              placeholderTextColor={Colors.light.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Last Name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              placeholder="Enter last name"
              placeholderTextColor={Colors.light.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="Enter email"
              placeholderTextColor={Colors.light.icon}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.phone}
              editable={false}
              placeholderTextColor={Colors.light.icon}
            />
            <ThemedText style={styles.helpText}>Phone number cannot be changed</ThemedText>
          </View>
        </ThemedView>

        {/* Vehicle Information */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Vehicle Information</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Vehicle Type</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.vehicleType}
              onChangeText={(value) => updateField('vehicleType', value)}
              placeholder="e.g., Truck, Van"
              placeholderTextColor={Colors.light.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Vehicle Model</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.vehicleModel}
              onChangeText={(value) => updateField('vehicleModel', value)}
              placeholder="e.g., Toyota Hilux"
              placeholderTextColor={Colors.light.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Vehicle Year</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.vehicleYear}
              onChangeText={(value) => updateField('vehicleYear', value)}
              placeholder="e.g., 2020"
              placeholderTextColor={Colors.light.icon}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>License Plate</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.licensePlate}
              onChangeText={(value) => updateField('licensePlate', value)}
              placeholder="e.g., ABC123DE"
              placeholderTextColor={Colors.light.icon}
              autoCapitalize="characters"
            />
          </View>
        </ThemedView>

        {/* Documents */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Documents</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Driver's License</ThemedText>
            {formData.driversLicense && formData.driversLicense.startsWith('http') ? (
              <DocumentViewer
                url={formData.driversLicense}
                type="driversLicense"
                onPress={() => {
                  setPreviewUrl(formData.driversLicense);
                  setPreviewType('driversLicense');
                  setPreviewVisible(true);
                }}
              />
            ) : (
              <View style={styles.emptyDocument}>
                <Ionicons name="document-outline" size={32} color={Colors.light.icon} />
                <ThemedText style={styles.emptyDocumentText}>No document uploaded</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Vehicle Registration</ThemedText>
            {formData.vehicleRegistration && formData.vehicleRegistration.startsWith('http') ? (
              <DocumentViewer
                url={formData.vehicleRegistration}
                type="vehicleRegistration"
                onPress={() => {
                  setPreviewUrl(formData.vehicleRegistration);
                  setPreviewType('vehicleRegistration');
                  setPreviewVisible(true);
                }}
              />
            ) : (
              <View style={styles.emptyDocument}>
                <Ionicons name="document-outline" size={32} color={Colors.light.icon} />
                <ThemedText style={styles.emptyDocumentText}>No document uploaded</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Insurance</ThemedText>
            {formData.insurance && formData.insurance.startsWith('http') ? (
              <DocumentViewer
                url={formData.insurance}
                type="insurance"
                onPress={() => {
                  setPreviewUrl(formData.insurance);
                  setPreviewType('insurance');
                  setPreviewVisible(true);
                }}
              />
            ) : (
              <View style={styles.emptyDocument}>
                <Ionicons name="document-outline" size={32} color={Colors.light.icon} />
                <ThemedText style={styles.emptyDocumentText}>No document uploaded</ThemedText>
              </View>
            )}
          </View>
        </ThemedView>

        {/* Document Preview Modal */}
        <DocumentPreviewModal
          visible={previewVisible}
          url={previewUrl}
          type={previewType}
          onClose={() => setPreviewVisible(false)}
        />

        {/* Bank Details */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Bank Details</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Bank Name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.bankName}
              onChangeText={(value) => updateField('bankName', value)}
              placeholder="Enter bank name"
              placeholderTextColor={Colors.light.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Account Number</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.accountNumber}
              onChangeText={(value) => updateField('accountNumber', value)}
              placeholder="Enter account number"
              placeholderTextColor={Colors.light.icon}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Account Name</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.accountName}
              onChangeText={(value) => updateField('accountName', value)}
              placeholder="Enter account holder name"
              placeholderTextColor={Colors.light.icon}
            />
          </View>
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
    marginBottom: 16,
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
  inputDisabled: {
    backgroundColor: Colors.light.secondary,
    opacity: 0.6,
  },
  helpText: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  documentContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.secondary,
    backgroundColor: Colors.light.surface,
    marginTop: 8,
  },
  documentImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.light.secondary,
  },
  documentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentInfoText: {
    fontSize: 12,
    color: Colors.light.background,
    fontWeight: '500',
  },
  pdfContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    gap: 8,
  },
  pdfText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
  },
  pdfSubtext: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  genericDocumentContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    gap: 8,
  },
  genericDocumentText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
  },
  genericDocumentSubtext: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  emptyDocument: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyDocumentText: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  imageScrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    backgroundColor: Colors.light.surface,
  },
  pdfPreviewContainer: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  pdfPreviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  pdfPreviewSubtext: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    marginTop: 8,
  },
  openPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  openPdfButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  unsupportedText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  unsupportedSubtext: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  openExternallyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  openExternallyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
  },
});
