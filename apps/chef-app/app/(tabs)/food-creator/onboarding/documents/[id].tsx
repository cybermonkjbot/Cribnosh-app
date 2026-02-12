import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, CheckCircle, FileText, Upload, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function DocumentUploadScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; returnPath?: string }>();
  const { showSuccess, showError } = useToast();

  const documentId = params.id;
  const returnPath = params.returnPath;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Get document details
  const documents = useQuery(
    api.queries.chefDocuments.getByChefId,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  );

  const document = documents?.find((d: any) => d._id === documentId);

  const uploadDocument = useMutation(api.mutations.uploadDocument);

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
    if (!selectedImage || !chef?._id || !document || !sessionToken) {
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
      const fileName = `document.${fileExtension}`;

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

      // Step 5: Get file URL using action (since we need to use storage.getUrl)
      // For now, we'll construct a URL pattern - the actual URL will be generated when needed
      // The fileUrl will be set when the document is queried
      const fileUrl = `/api/files/${storageId}`;

      // Step 6: Create document record
      await uploadDocument({
        chefId: chef._id,
        documentType: document.documentType,
        documentName: document.documentName || document.documentType,
        fileName,
        fileStorageId: storageId as any,
        fileUrl, // This will be replaced with actual URL when queried
        fileSize,
        mimeType,
        isRequired: document.isRequired || false,
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

  if (!document) {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#094327" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={20} color="#4CAF50" />;
      case 'rejected':
        return <XCircle size={20} color="#F44336" />;
      default:
        return <FileText size={20} color="#FF9800" />;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: document.documentName || document.documentType
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
          <Text style={styles.mainTitle}>{document.documentName || document.documentType}</Text>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusInfo}>
                {getStatusIcon(document.status)}
                <Text style={styles.statusLabel}>Status</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(document.status) + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(document.status) }]}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </Text>
              </View>
            </View>
            {document.status === 'rejected' && document.rejectionReason && (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionTitle}>Rejection Reason:</Text>
                <Text style={styles.rejectionText}>{document.rejectionReason}</Text>
                {document.rejectionDetails && (
                  <Text style={styles.rejectionDetails}>{document.rejectionDetails}</Text>
                )}
              </View>
            )}
            {document.status === 'verified' && document.verifiedAt && (
              <Text style={styles.verifiedText}>
                Verified on {new Date(document.verifiedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            )}
          </View>

          {/* Current Document */}
          {document.fileUrl && (
            <View style={styles.documentCard}>
              <Text style={styles.sectionTitle}>Current Document</Text>
              <Image source={{ uri: document.fileUrl }} style={styles.documentImage} />
              <View style={styles.documentInfo}>
                <Text style={styles.documentFileName}>{document.fileName}</Text>
                <Text style={styles.documentSize}>
                  {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                </Text>
              </View>
            </View>
          )}

          {/* Upload Section */}
          {document.status !== 'verified' && (
            <View style={styles.uploadCard}>
              <Text style={styles.sectionTitle}>
                {document.fileUrl ? 'Replace Document' : 'Upload Document'}
              </Text>
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
                      <Upload size={24} color="#094327" />
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
          )}

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
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  rejectionBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  rejectionTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#EF4444',
    marginBottom: 8,
  },
  rejectionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  rejectionDetails: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  verifiedText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#0B9E58',
    marginTop: 12,
  },
  documentCard: {
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
    marginBottom: 16,
  },
  documentImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  documentInfo: {
    marginTop: 8,
  },
  documentFileName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 4,
  },
  documentSize: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
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

