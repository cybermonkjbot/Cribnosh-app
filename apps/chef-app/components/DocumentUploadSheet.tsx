import { CameraModalScreen } from '@/components/ui/CameraModalScreen';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { useMutation, useQuery } from 'convex/react';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera, HelpCircle, Upload as UploadIcon, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

interface DocumentUploadSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

// Icons
const checkIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 6L9 17L4 12" stroke="#0B9E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const circleIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="#9CA3AF" stroke-width="2"/>
</svg>`;

const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

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

// Required compliance document types
const REQUIRED_DOCUMENTS = [
  { type: 'fba' as const, name: 'Food Business Approval (FBA)', isRequired: true },
  { type: 'health_permit' as const, name: 'Health Permit', isRequired: true },
  { type: 'insurance' as const, name: 'Insurance Certificate', isRequired: true },
  { type: 'kitchen_cert' as const, name: 'Kitchen Certification', isRequired: true },
];

interface DocumentItem {
  id: string;
  type: string;
  name: string;
  status: 'verified' | 'pending' | 'rejected' | 'missing';
  completed: boolean;
  description: string;
  documentId?: string;
}

interface DocumentItemComponentProps {
  item: DocumentItem;
  index: number;
  totalItems: number;
  onPress: (item: DocumentItem) => void;
  checkIconSVG: string;
  circleIconSVG: string;
  chevronRightIconSVG: string;
}

// Memoized document item component
const DocumentItemComponent: React.FC<DocumentItemComponentProps> = React.memo(({
  item,
  index,
  totalItems,
  onPress,
  checkIconSVG,
  circleIconSVG,
  chevronRightIconSVG,
}) => {
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  const getStatusDescription = () => {
    switch (item.status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending verification';
      case 'rejected':
        return 'Rejected - tap to view details';
      default:
        return 'Tap to upload';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.documentItem,
        index === totalItems - 1 && styles.lastItem
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          {item.completed ? (
            <SvgXml xml={checkIconSVG} width={24} height={24} />
          ) : (
            <SvgXml xml={circleIconSVG} width={24} height={24} />
          )}
        </View>
        <View style={styles.itemContent}>
          <Text style={[
            styles.itemTitle,
            item.completed && styles.itemTitleCompleted
          ]}>
            {item.name}
          </Text>
          <Text style={styles.itemDescription}>
            {getStatusDescription()}
          </Text>
        </View>
      </View>
      {!item.completed && (
        <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
      )}
    </TouchableOpacity>
  );
});

DocumentItemComponent.displayName = 'DocumentItemComponent';

export function DocumentUploadSheet({ isVisible, onClose }: DocumentUploadSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chef, sessionToken: authSessionToken } = useChefAuth();
  const { showSuccess, showError } = useToast();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Upload state
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const uploadDocument = useMutation(api.mutations.chefDocuments.uploadDocument);

  // Get session token
  const loadToken = useCallback(async () => {
    if (authSessionToken) {
      setSessionToken(authSessionToken);
    } else {
      const token = await getSessionToken();
      setSessionToken(token);
    }
  }, [authSessionToken]);

  useEffect(() => {
    if (isVisible && chef) {
      loadToken();
    }
  }, [isVisible, chef, loadToken]);

  // Get chef documents
  const documents = useQuery(
    api.queries.chefDocuments.getByChefId,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Map documents by type for easy lookup
  const documentsByType = useMemo(() => {
    if (!documents) return {};
    const map: Record<string, typeof documents[0]> = {};
    documents.forEach((doc: any) => {
      map[doc.documentType] = doc;
    });
    return map;
  }, [documents]);

  // Helper function to get status description
  const getStatusDescription = useCallback((status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending verification';
      case 'rejected':
        return 'Rejected - needs resubmission';
      default:
        return 'Not uploaded';
    }
  }, []);

  // Build document items list
  const documentItems = useMemo<DocumentItem[]>(() => {
    return REQUIRED_DOCUMENTS.map(doc => {
      const existingDoc = documentsByType[doc.type];
      const status = existingDoc?.status || 'missing';
      const completed = status === 'verified';

      return {
        id: doc.type,
        type: doc.type,
        name: doc.name,
        status: status as 'verified' | 'pending' | 'rejected' | 'missing',
        completed,
        description: completed ? 'Document verified' : getStatusDescription(status),
        documentId: existingDoc?._id,
      };
    });
  }, [documentsByType, getStatusDescription]);

  // Memoize progress calculations
  const { completedCount, totalCount, progressPercentage } = useMemo(() => {
    const completed = documentItems.filter(item => item.completed).length;
    const total = documentItems.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completedCount: completed, totalCount: total, progressPercentage: percentage };
  }, [documentItems]);

  // Determine if we have enough data to show content
  const hasMinimumData = useMemo(() => {
    return !!chef;
  }, [chef]);

  const handleItemPress = useCallback((item: DocumentItem) => {
    console.log('Document item pressed:', item);

    // If document is rejected, navigate to detailed screen for resubmission
    if (item.status === 'rejected' && item.documentId) {
      onClose();
      setTimeout(() => {
        router.push(`/(tabs)/food-creator/onboarding/documents/${item.documentId}` as any);
      }, 300);
      return;
    }

    // If verified, don't allow re-upload from here
    if (item.completed) {
      console.log('Document already verified, skipping');
      return;
    }

    // Open upload modal for new uploads or pending documents
    console.log('Opening upload modal for:', item.name);
    setSelectedDocument(item);
    setShowUploadModal(true);
  }, [onClose, router]);

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

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleUpload = async () => {
    if (!selectedImage || !selectedDocument || !chef?._id || !sessionToken) {
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
      const fileName = `${selectedDocument.type}.${fileExtension}`;
      const documentName = DOCUMENT_NAMES[selectedDocument.type] || selectedDocument.name;

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
        documentType: selectedDocument.type as any,
        documentName,
        fileName,
        fileStorageId: storageId as any,
        fileUrl,
        fileSize,
        mimeType,
        isRequired: true,
        sessionToken,
      });

      showSuccess('Document Uploaded', 'Your document has been submitted for verification.');

      // Reset state and close modal
      setSelectedImage(null);
      setSelectedDocument(null);
      setShowUploadModal(false);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      showError('Upload Failed', error.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUploadModal = () => {
    if (!isUploading) {
      setSelectedImage(null);
      setSelectedDocument(null);
      setShowUploadModal(false);
    }
  };

  const handleGetHelp = useCallback(() => {
    setShowHelpModal(true);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: Math.max(insets.top - 8, 0) }]}>
            <Text style={styles.headerTitle}>Upload Required Documents</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
          </View>

          {!hasMinimumData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#094327" />
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Document Items */}
              <View style={styles.itemsSection}>
                {documentItems.map((item, index) => (
                  <DocumentItemComponent
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={documentItems.length}
                    onPress={handleItemPress}
                    checkIconSVG={checkIconSVG}
                    circleIconSVG={circleIconSVG}
                    chevronRightIconSVG={chevronRightIconSVG}
                  />
                ))}
              </View>

              {/* Help Text */}
              <View style={styles.helpSection}>
                <Text style={styles.helpText}>
                  Upload all required documents to complete your verification and start receiving orders on CribNosh
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Floating Get Help Button */}
          {hasMinimumData && (
            <TouchableOpacity
              style={[styles.floatingHelpButton, { bottom: insets.bottom + 20 }]}
              onPress={handleGetHelp}
              activeOpacity={0.8}
            >
              <HelpCircle size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Upload Modal Overlay */}
          {showUploadModal && selectedDocument && (
            <View style={styles.uploadModalOverlay}>
              <TouchableOpacity
                style={styles.uploadModalBackdrop}
                activeOpacity={1}
                onPress={handleCloseUploadModal}
                disabled={isUploading}
              />
              <View style={styles.uploadModalContent}>
                <View style={styles.uploadModalHeader}>
                  <Text style={styles.uploadModalTitle}>{selectedDocument.name}</Text>
                  <TouchableOpacity
                    onPress={handleCloseUploadModal}
                    style={styles.uploadModalCloseButton}
                    disabled={isUploading}
                  >
                    <X size={24} color="#094327" />
                  </TouchableOpacity>
                </View>

                {selectedImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.imagePreview}
                      onError={() => {
                        console.warn('Failed to load document image:', selectedImage);
                      }}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={handleRemoveImage}
                      disabled={isUploading}
                    >
                      <X size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadOptionsContainer}>
                    <TouchableOpacity
                      style={styles.uploadOption}
                      onPress={handleTakePhoto}
                      disabled={isUploading}
                    >
                      <Camera size={32} color="#094327" />
                      <Text style={styles.uploadOptionText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.uploadOption}
                      onPress={handlePickFromGallery}
                      disabled={isUploading}
                    >
                      <UploadIcon size={32} color="#094327" />
                      <Text style={styles.uploadOptionText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedImage && (
                  <TouchableOpacity
                    style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                    onPress={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.uploadButtonText}>Upload Document</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Help Modal Overlay */}
          {showHelpModal && (
            <View style={styles.helpModalOverlay}>
              <TouchableOpacity
                style={styles.helpModalBackdrop}
                activeOpacity={1}
                onPress={() => setShowHelpModal(false)}
              />
              <View style={styles.helpModalContent}>
                <View style={styles.helpModalHeader}>
                  <Text style={styles.helpModalTitle}>Get Help with Documents</Text>
                  <TouchableOpacity
                    onPress={() => setShowHelpModal(false)}
                    style={styles.helpModalCloseButton}
                  >
                    <X size={24} color="#094327" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.helpModalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.helpModalSection}>
                    <Text style={styles.helpSectionTitle}>Food Business Approval (FBA)</Text>
                    <Text style={styles.helpSectionText}>
                      Register your food business with your local council. This is free and required by law.
                    </Text>
                    <Text style={styles.helpLink}>Find your local council: food.gov.uk</Text>
                  </View>

                  <View style={styles.helpModalSection}>
                    <Text style={styles.helpSectionTitle}>Health Permit</Text>
                    <Text style={styles.helpSectionText}>
                      Contact your local Environmental Health Department for inspections and permits.
                    </Text>
                    <Text style={styles.helpLink}>Visit: food.gov.uk/business</Text>
                  </View>

                  <View style={styles.helpModalSection}>
                    <Text style={styles.helpSectionTitle}>Insurance Certificate</Text>
                    <Text style={styles.helpSectionText}>
                      Get public liability insurance for your food business. Compare quotes from providers like Simply Business, Hiscox, or Qdos.
                    </Text>
                    <Text style={styles.helpLink}>Compare quotes: simplybusiness.co.uk</Text>
                  </View>

                  <View style={styles.helpModalSection}>
                    <Text style={styles.helpSectionTitle}>Kitchen Certification</Text>
                    <Text style={styles.helpSectionText}>
                      Your kitchen may need certification from your local authority or a private certification body like SALSA or BRC.
                    </Text>
                    <Text style={styles.helpLink}>Learn more: salsa.co.uk</Text>
                  </View>

                  <View style={styles.helpFooter}>
                    <Text style={styles.helpFooterText}>
                      Need more assistance? Contact our support team for guidance.
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Camera Modal */}
      {showCamera && (
        <CameraModalScreen

          onClose={() => setShowCamera(false)}
          onPhotoCaptured={handlePhotoCaptured}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  // Items Section
  itemsSection: {
    marginBottom: 32,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lastItem: {
    marginBottom: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  itemTitleCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  // Help Section
  helpSection: {
    backgroundColor: '#E6FFE8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  helpText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    textAlign: 'center',
  },
  // Upload Modal
  uploadModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10000,
    pointerEvents: 'box-none',
  },
  uploadModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto',
  },
  uploadModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    zIndex: 10001,
    pointerEvents: 'auto',
  },
  uploadModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  uploadModalTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    flex: 1,
  },
  uploadModalCloseButton: {
    padding: 4,
  },
  uploadOptionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  uploadOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    marginTop: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#F9FAFB',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Floating Help Button
  floatingHelpButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#094327',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Help Modal
  helpModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10000,
    pointerEvents: 'box-none',
  },
  helpModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto',
  },
  helpModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    zIndex: 10001,
    pointerEvents: 'auto',
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  helpModalTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
    flex: 1,
  },
  helpModalCloseButton: {
    padding: 4,
    marginLeft: 16,
  },
  helpModalScroll: {
    maxHeight: 500,
  },
  helpModalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  helpSectionTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  helpSectionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  helpLink: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#FF3B30',
  },
  helpFooter: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  helpFooterText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});
