import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/ToastContext';
import { Camera, Upload, CheckCircle, XCircle, FileText } from 'lucide-react-native';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import * as FileSystem from 'expo-file-system';

export default function DocumentUploadScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  
  const documentId = params.id;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Get document details
  const documents = useQuery(
    api.queries.getChefDocumentsByChefId,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  );

  const document = documents?.find(d => d._id === documentId);

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
      router.back();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      showError('Upload Failed', error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{document.documentName || document.documentType}</Text>
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              {getStatusIcon(document.status)}
              <Text style={styles.statusLabel}>Status</Text>
            </View>
            <Text style={[styles.statusText, { color: getStatusColor(document.status) }]}>
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </Text>
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
              Verified on {new Date(document.verifiedAt).toLocaleDateString()}
            </Text>
          )}
        </Card>

        {/* Current Document */}
        {document.fileUrl && (
          <Card style={styles.documentCard}>
            <Text style={styles.sectionTitle}>Current Document</Text>
            <Image source={{ uri: document.fileUrl }} style={styles.documentImage} />
            <Text style={styles.documentFileName}>{document.fileName}</Text>
            <Text style={styles.documentSize}>
              {(document.fileSize / 1024 / 1024).toFixed(2)} MB
            </Text>
          </Card>
        )}

        {/* Upload Section */}
        {document.status !== 'verified' && (
          <Card style={styles.uploadCard}>
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
                >
                  <Camera size={32} color="#007AFF" />
                  <Text style={styles.uploadOptionText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  style={styles.uploadOption}
                >
                  <Upload size={32} color="#007AFF" />
                  <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Upload Button */}
            {selectedImage && (
              <Button
                onPress={handleUpload}
                disabled={isUploading}
                style={styles.uploadButton}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  'Upload Document'
                )}
              </Button>
            )}
          </Card>
        )}

        {/* Requirements */}
        <Card style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Requirements</Text>
          <Text style={styles.requirementsText}>
            • Document must be clear and fully visible{'\n'}
            • All text must be readable{'\n'}
            • Document must be valid and not expired{'\n'}
            • File size must be under 10MB
          </Text>
        </Card>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statusCard: {
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#666',
  },
  rejectionDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 8,
  },
  documentCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  documentFileName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#999',
  },
  uploadCard: {
    padding: 16,
    marginBottom: 16,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#F44336',
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  uploadOption: {
    flex: 1,
    padding: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  uploadOptionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  uploadButton: {
    width: '100%',
  },
  requirementsCard: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

