import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useToast } from '@/lib/ToastContext';
import { Camera, Upload as UploadIcon } from 'lucide-react-native';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import * as FileSystem from 'expo-file-system';
import { SvgXml } from 'react-native-svg';

// Document type to name mapping
const DOCUMENT_NAMES: Record<string, string> = {
  fba: 'Food Business Approval (FBA)',
  health_permit: 'Health Permit',
  insurance: 'Insurance Certificate',
  kitchen_cert: 'Kitchen Certification',
  id: 'ID Document',
  tax: 'Tax Document',
  other: 'Other Document',
};

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function DocumentUploadByTypeScreen() {
  const { foodCreator: chef, sessionToken } = useFoodCreatorAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string; returnPath?: string }>();
  const { showSuccess, showError } = useToast();
  
  const documentType = params.type;
  const returnPath = params.returnPath;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const uploadDocument = useMutation(api.mutations.chefDocuments.uploadDocument);

  if (!documentType || !chef?._id || !sessionToken) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#094327" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const documentName = DOCUMENT_NAMES[documentType] || documentType;

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handlePhotoCaptured = (photoUri: string) => {
    setSelectedImage(photoUri);
    setShowCamera(false);
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to select documents.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage || !chef?._id || !sessionToken) {
      return;
    }

    setIsUploading(true);

    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(selectedImage);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

      // Get file extension and mime type
      const uriParts = selectedImage.split('.');
      const fileExtension = uriParts[uriParts.length - 1];
      const mimeType = `image/${fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'jpeg' : fileExtension}`;
      const fileName = `${documentType}.${fileExtension}`;

      // Step 1: Generate upload URL
      const convex = getConvexClient();
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      // Step 2: Read file and convert to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Step 3: Upload file to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Step 4: Get storage ID from response
      const result = await uploadResponse.json();
      const storageId = result.storageId || result;

      if (!storageId) {
        throw new Error('No storage ID in upload response');
      }

      // Step 5: Get file URL
      const fileUrl = `/api/files/${storageId}`;

      // Step 6: Create document record
      await uploadDocument({
        chefId: chef._id,
        documentType: documentType as any,
        documentName,
        fileName,
        fileStorageId: storageId as any,
        fileUrl,
        fileSize,
        mimeType,
        isRequired: true, // Compliance documents are required
        sessionToken,
      });

      showSuccess('Document Uploaded', 'Your document has been submitted for verification.');
      // Small delay to ensure success message is shown before navigating
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else if (returnPath) {
          router.push(returnPath as any);
        } else {
          router.push('/food-safety-compliance' as any);
        }
      }, 500);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      showError('Upload Failed', error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: documentName
        }} 
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else if (returnPath) {
                router.push(returnPath as any);
              } else {
                router.push('/food-safety-compliance' as any);
              }
            }}
          >
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>{documentName}</Text>

          {/* Upload Section */}
          <View style={styles.uploadCard}>
            <Text style={styles.sectionTitle}>Upload Document</Text>
            <Text style={styles.uploadDescription}>
              Take a clear photo or select from your gallery. Make sure the document is fully visible and readable.
            </Text>

            {/* Selected Image Preview */}
            {selectedImage && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <TouchableOpacity
                  onPress={() => setSelectedImage(null)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Upload Options */}
            {!selectedImage && (
              <View style={styles.uploadOptions}>
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  style={styles.uploadOption}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadOptionIconContainer}>
                    <Camera size={24} color="#094327" />
                  </View>
                  <Text style={styles.uploadOptionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  style={styles.uploadOption}
                  activeOpacity={0.7}
                >
                  <View style={styles.uploadOptionIconContainer}>
                    <UploadIcon size={24} color="#094327" />
                  </View>
                  <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Upload Button */}
            {selectedImage && (
              <TouchableOpacity
                onPress={handleUpload}
                disabled={isUploading}
                style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                activeOpacity={0.8}
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload Document</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Requirements</Text>
            <Text style={styles.requirementsText}>
              • Document must be clear and fully visible{'\n'}
              • All text must be readable{'\n'}
              • Document must be valid and not expired{'\n'}
              • File size must be under 10MB
            </Text>
          </View>
        </ScrollView>

      {/* Camera Modal */}
      {showCamera && (
        <Modal
          visible={showCamera}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowCamera(false)}
          statusBarTranslucent={true}
          hardwareAccelerated={true}
        >
          <CameraModalScreen
            onClose={() => setShowCamera(false)}
            onPhotoCaptured={handlePhotoCaptured}
            showGoLiveButton={false}
            showVideoRecording={false}
            showFilters={false}
            mode="photo"
          />
        </Modal>
      )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: '#094327',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    color: '#6B7280',
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 12,
  },
  uploadDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 24,
  },
  previewContainer: {
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  removeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#EF4444',
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  uploadOptionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6FFE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    textAlign: 'center',
  },
  uploadButton: {
    width: '100%',
    backgroundColor: '#094327',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  requirementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requirementsTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 12,
  },
  requirementsText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});

