import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { IconName } from '../utils/Logger';
import * as ImagePicker from 'expo-image-picker';
import { useGetDriverDocumentsQuery, useUploadDriverDocumentMutation } from '../store/driverApi';

export default function DocumentsScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  
  // Fetch verification status and document expiry info
  // TODO: Replace with Cribnosh query
  // const verificationStatus = useSessionAwareQuery(
  //   api.queries.delivery.getDriverVerificationStatus,
  //   driver?._id ? { driverId: driver._id as Id<"drivers"> } : "skip"
  // );
  const verificationStatus = null; // Placeholder

  // Fetch driver documents using RTK Query
  const { data: documentsData, isLoading: isLoadingDocuments } = useGetDriverDocumentsQuery(
    undefined,
    { skip: !driver }
  );

  // RTK Query mutation for document upload
  const [uploadDriverDocument, { isLoading: isUploading }] = useUploadDriverDocumentMutation();

  // TODO: Use API endpoints for file upload when available
  const generateUploadUrl = null as any;
  const confirmUpload = null as any;
  const updateDriverProfile = null as any;

  const handleBack = () => {
    router.back();
  };

  const handleUploadDocument = async (docType: 'driversLicense' | 'vehicleRegistration' | 'insurance') => {
    try {
      // Pick document/image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const fileUri = asset.uri;
      const fileName = asset.fileName || `document_${Date.now()}.jpg`;
      const fileType = asset.type || 'image/jpeg';

      // Generate upload URL
      const uploadData = await generateUploadUrl({
        fileName,
        fileType,
        documentType: docType,
      });

      if (!uploadData.uploadUrl || !uploadData.fileId) {
        throw new Error('Failed to generate upload URL');
      }

      // Upload file
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      } as any);

      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const storageId = uploadResult.storageId || uploadResult.id;

      if (!storageId) {
        throw new Error('Storage ID not found in upload response');
      }

      // Confirm upload
      const confirmResult = await confirmUpload({
        fileId: storageId as any,
        recordId: uploadData.fileId,
      });

      if (!confirmResult.success) {
        throw new Error(confirmResult.error || 'Upload confirmation failed');
      }

      const fileUrl = confirmResult.fileUrl || '';

      // Update driver document
      if (driver?._id) {
        const updates: any = {};
        if (docType === 'driversLicense') {
          updates.driversLicense = fileUrl;
          updates.driversLicenseFileId = uploadData.fileId;
          updates.driversLicenseUploadedAt = Date.now();
        } else if (docType === 'vehicleRegistration') {
          updates.vehicleRegistration = fileUrl;
          updates.vehicleRegistrationFileId = uploadData.fileId;
          updates.vehicleRegistrationUploadedAt = Date.now();
        } else if (docType === 'insurance') {
          updates.insurance = fileUrl;
          updates.insuranceFileId = uploadData.fileId;
          updates.insuranceUploadedAt = Date.now();
        }

        await updateDriverProfile({
          driverId: driver._id as Id<"drivers">,
          updates,
        });
      }

      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      Alert.alert('Error', errorMessage);
    }
  };

  // Map document status from backend to display
  const getDocumentInfo = (docId: 'driversLicense' | 'vehicleRegistration' | 'insurance') => {
    const docStatus = verificationStatus?.documents?.[docId];
    const hasFile = docId === 'driversLicense' ? driver?.driversLicense 
      : docId === 'vehicleRegistration' ? driver?.vehicleRegistration 
      : driver?.insurance;
    
    const status = docStatus?.status || (hasFile ? 'PENDING' : 'MISSING');
    const daysUntilExpiry = docStatus?.daysUntilExpiry;
    
    let displayStatus = status;
    let statusColor = Colors.light.icon;
    let statusText = 'Unknown';
    let expiryWarning = '';
    
    switch (status) {
      case 'VERIFIED':
        statusColor = Colors.light.accent;
        statusText = 'Verified';
        if (daysUntilExpiry !== undefined && daysUntilExpiry !== null) {
          if (daysUntilExpiry <= 0) {
            displayStatus = 'EXPIRED';
            statusColor = Colors.light.error;
            statusText = 'Expired';
            expiryWarning = 'This document has expired. Please renew it.';
          } else if (daysUntilExpiry <= 7) {
            displayStatus = 'WARNING';
            statusColor = Colors.light.warning;
            statusText = 'Expiring Soon';
            expiryWarning = `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
          } else if (daysUntilExpiry <= 30) {
            displayStatus = 'WARNING';
            statusColor = Colors.light.warning;
            statusText = `Expires in ${daysUntilExpiry} days`;
            expiryWarning = `Expires in ${daysUntilExpiry} days`;
          }
        }
        break;
      case 'PENDING':
        statusColor = Colors.light.warning;
        statusText = 'Pending';
        break;
      case 'REJECTED':
        statusColor = Colors.light.error;
        statusText = 'Rejected';
        break;
      case 'WARNING':
        statusColor = Colors.light.warning;
        statusText = 'Warning';
        if (daysUntilExpiry !== undefined && daysUntilExpiry !== null) {
          expiryWarning = `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
        }
        break;
      case 'EXPIRED':
        statusColor = Colors.light.error;
        statusText = 'Expired';
        expiryWarning = 'This document has expired. Please renew it.';
        break;
      case 'MISSING':
      default:
        statusColor = Colors.light.error;
        statusText = 'Missing';
        break;
    }
    
    const isMissing = status === 'MISSING' || (!hasFile && status !== 'VERIFIED');
    
    return {
      status: displayStatus,
      statusColor,
      statusText,
      expiryWarning,
      daysUntilExpiry,
      isMissing,
      hasFile: !!hasFile,
    };
  };

  const documents = [
    {
      id: 'driversLicense' as const,
      title: "Driver's License",
      description: driver?.driversLicense || 'Not provided',
      icon: 'card' as IconName,
      ...getDocumentInfo('driversLicense'),
    },
    {
      id: 'vehicleRegistration' as const,
      title: 'Vehicle Registration',
      description: driver?.vehicleRegistration || 'Not provided',
      icon: 'document-text' as IconName,
      ...getDocumentInfo('vehicleRegistration'),
    },
    {
      id: 'insurance' as const,
      title: 'Insurance',
      description: driver?.insurance || 'Not provided',
      icon: 'shield-checkmark' as IconName,
      ...getDocumentInfo('insurance'),
    },
  ];

  // Calculate progress
  const getVerificationProgress = () => {
    const verifiedCount = documents.filter(doc => {
      const info = getDocumentInfo(doc.id as 'driversLicense' | 'vehicleRegistration' | 'insurance');
      return info.status === 'VERIFIED';
    }).length;
    return { verified: verifiedCount, total: 3 };
  };

  const progress = getVerificationProgress();
  const missingDocuments = documents.filter(doc => {
    const info = getDocumentInfo(doc.id as 'driversLicense' | 'vehicleRegistration' | 'insurance');
    return info.isMissing;
  });
  
  // Get verification status message
  const getVerificationStatusMessage = () => {
    const status = verificationStatus?.verificationStatus || 'PENDING';
    switch (status) {
      case 'APPROVED':
        return { message: 'Your account has been verified. You can now accept orders.', color: Colors.light.accent };
      case 'REJECTED':
        return { 
          message: verificationStatus?.verificationNotes || 'Your verification was rejected. Please review your documents and re-submit.', 
          color: Colors.light.error 
        };
      case 'EXPIRED':
        return { message: 'One or more documents have expired. Please renew them to continue.', color: Colors.light.error };
      case 'PENDING':
      default:
        return { message: 'Your verification is pending review. You can view orders but cannot accept them until verified.', color: Colors.light.warning };
    }
  };
  
  const verificationMessage = getVerificationStatusMessage();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Documents</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Verification Status Banner */}
        {verificationStatus && (
          <ThemedView style={[styles.verificationBanner, { backgroundColor: verificationMessage.color + '20', borderLeftColor: verificationMessage.color }]}>
            <View style={styles.verificationBannerHeader}>
              <Ionicons 
                name={verificationStatus.verificationStatus === 'APPROVED' ? 'checkmark-circle' : 'alert-circle'} 
                size={20} 
                color={verificationMessage.color} 
              />
              <ThemedText style={[styles.verificationBannerTitle, { color: verificationMessage.color }]}>
                Verification {verificationStatus.verificationStatus === 'APPROVED' ? 'Approved' : verificationStatus.verificationStatus === 'REJECTED' ? 'Rejected' : verificationStatus.verificationStatus === 'EXPIRED' ? 'Expired' : 'Pending'}
              </ThemedText>
            </View>
            <ThemedText style={styles.verificationBannerMessage}>
              {verificationMessage.message}
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Required Documents</ThemedText>
          <ThemedText style={styles.description}>
            All documents must be verified before you can start accepting deliveries.
          </ThemedText>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={[
                styles.progressBar,
                { 
                  width: `${(progress.verified / progress.total) * 100}%`,
                  backgroundColor: progress.verified === progress.total 
                    ? Colors.light.accent 
                    : progress.verified > 0 
                    ? Colors.light.warning 
                    : Colors.light.error
                }
              ]} />
            </View>
            <ThemedText style={styles.progressText}>
              {progress.verified} of {progress.total} documents verified
            </ThemedText>
          </View>
        </ThemedView>

        {documents.map((doc) => {
          const docInfo = getDocumentInfo(doc.id as 'driversLicense' | 'vehicleRegistration' | 'insurance');
          const isMissing = docInfo.isMissing;
          const isPending = docInfo.status === 'PENDING' && docInfo.hasFile;
          const isRejected = docInfo.status === 'REJECTED';
          
          return (
          <TouchableOpacity
            key={doc.id}
            style={styles.documentCard}
            onPress={() => {
              if (isMissing || isRejected) {
                handleUploadDocument(doc.id);
              }
            }}
            disabled={!isMissing && !isRejected}
            activeOpacity={isMissing || isRejected ? 0.7 : 1}
          >
            <View style={styles.documentHeader}>
              <View style={[styles.documentIcon, { backgroundColor: docInfo.statusColor + '20' }]}>
                <Ionicons 
                  name={
                    doc.id === 'driversLicense' ? 'id-card-outline' :
                    doc.id === 'vehicleRegistration' ? 'document-attach-outline' :
                    'shield-checkmark-outline'
                  } 
                  size={24} 
                  color={docInfo.statusColor} 
                />
              </View>
              <View style={styles.documentInfo}>
                <ThemedText style={styles.documentTitle}>{doc.title}</ThemedText>
                <ThemedText style={styles.documentDescription}>
                  {isMissing 
                    ? 'Not provided' 
                    : isPending 
                    ? 'Pending review'
                    : doc.description !== 'Not provided' 
                    ? 'Uploaded' 
                    : doc.description}
                </ThemedText>
                {docInfo.expiryWarning && (
                  <ThemedText style={[styles.expiryWarning, { color: docInfo.statusColor }]}>
                    {docInfo.expiryWarning}
                  </ThemedText>
                )}
              </View>
              <View style={styles.statusContainer}>
                {isMissing ? (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: Colors.light.primary }]}
                    onPress={() => handleUploadDocument(doc.id)}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color={Colors.light.background} />
                    <ThemedText style={styles.uploadButtonText}>Upload</ThemedText>
                  </TouchableOpacity>
                ) : isRejected ? (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: Colors.light.error }]}
                    onPress={() => handleUploadDocument(doc.id)}
                  >
                    <Ionicons name="refresh-outline" size={16} color={Colors.light.background} />
                    <ThemedText style={styles.uploadButtonText}>Re-upload</ThemedText>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: docInfo.statusColor + '20' }]}>
                    <Ionicons 
                      name={
                        docInfo.status === 'VERIFIED' ? 'checkmark-circle' : 
                        docInfo.status === 'EXPIRED' ? 'close-circle' :
                        docInfo.status === 'WARNING' ? 'warning' :
                        'time-outline'
                      } 
                      size={16} 
                      color={docInfo.statusColor} 
                    />
                    <ThemedText style={[styles.statusText, { color: docInfo.statusColor }]}>
                      {isPending ? 'Pending Review' : docInfo.statusText}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
        })}

        {/* Upload Missing Documents CTA */}
        {missingDocuments.length > 0 && (
          <TouchableOpacity
            style={styles.uploadAllButton}
            onPress={() => {
              if (missingDocuments.length > 0) {
                handleUploadDocument(missingDocuments[0].id as 'driversLicense' | 'vehicleRegistration' | 'insurance');
              }
            }}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={Colors.light.background} />
            <ThemedText style={styles.uploadAllButtonText}>
              Upload Missing Documents
            </ThemedText>
          </TouchableOpacity>
        )}
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
  headerSpacer: {
    width: 40,
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
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationBanner: {
    backgroundColor: Colors.light.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  verificationBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  verificationBannerMessage: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expiryWarning: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.light.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.background,
  },
  uploadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  uploadAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
});

