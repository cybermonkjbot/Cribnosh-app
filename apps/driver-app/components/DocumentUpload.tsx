import { Ionicons } from '@expo/vector-icons';
// TODO: Use API endpoints for file upload when available
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { logger } from '../utils/Logger';

interface DocumentUploadProps {
  documentType: 'driversLicense' | 'vehicleRegistration' | 'insurance';
  onUploadComplete?: (fileUrl: string, fileId: string) => void;
  onUploadError?: (error: string) => void;
  onFileSelected?: (hasFile: boolean) => void;
  suppressAlerts?: boolean;
  style?: any;
}

export interface DocumentUploadRef {
  upload: (suppressAlerts?: boolean) => Promise<void>;
  hasSelectedFile: () => boolean;
}

export const DocumentUpload = forwardRef<DocumentUploadRef, DocumentUploadProps>(function DocumentUpload({
  documentType,
  onUploadComplete,
  onUploadError,
  onFileSelected,
  suppressAlerts = false,
  style,
}, ref) {
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  // Convex mutations for file upload
  // Note: Using documents.generateUploadUrl from Cribnosh Convex
  // TODO: Use API endpoint for generating upload URL when available
  const generateUploadUrl = null as any;
  // TODO: Replace confirmUpload with appropriate Cribnosh mutation if available
  // For now, using a placeholder - may need to use files.uploadFile or similar
  // TODO: Use API endpoint for confirming upload when available
  const confirmUpload = null as any;

  const getDocumentInfo = () => {
    switch (documentType) {
      case 'driversLicense':
        return {
          title: "Driver's License",
          subtitle: "Upload front and back",
          icon: "card" as const,
        };
      case 'vehicleRegistration':
        return {
          title: "Vehicle Registration",
          subtitle: "Current registration document",
          icon: "car-sport" as const,
        };
      case 'insurance':
        return {
          title: "Insurance Certificate",
          subtitle: "Valid insurance coverage",
          icon: "shield-checkmark" as const,
        };
      default:
        return {
          title: "Document",
          subtitle: "Upload document",
          icon: "document-text" as const,
        };
    }
  };

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: `${documentType}_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize || 0,
        };
        setSelectedFile(file);
        onFileSelected?.(true);
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  }, [documentType, onFileSelected]);

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        };
        setSelectedFile(file);
        onFileSelected?.(true);
      }
    } catch (error) {
      logger.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  }, [onFileSelected]);

  const uploadFile = useCallback(async (suppressUploadAlerts?: boolean) => {
    if (!selectedFile) return;

    const shouldSuppressAlerts = suppressUploadAlerts !== undefined ? suppressUploadAlerts : suppressAlerts;
    setUploading(true);

    try {
      // Step 1: Generate upload URL
      const uploadData = await generateUploadUrl({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        category: `driver_${documentType}`,
        metadata: {},
      });

      // Step 2: Upload file to Convex storage
      const response = await fetch(uploadData.uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: await fetch(selectedFile.uri).then(res => res.blob()),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Get storage ID from upload response
      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Failed to get storage ID from upload response');
      }

      // Parse response - may be JSON or plain string
      let storageId: string;
      try {
        const parsed = JSON.parse(responseText);
        // Extract storageId if it's a JSON object, otherwise use the parsed value if it's a string
        if (typeof parsed === 'object' && parsed !== null && 'storageId' in parsed) {
          storageId = String(parsed.storageId);
        } else if (typeof parsed === 'string') {
          storageId = parsed.trim();
        } else {
          throw new Error('Unexpected response format');
        }
      } catch {
        // If not JSON, use the text directly as storage ID
        storageId = responseText.trim();
      }

      if (!storageId) {
        throw new Error('Storage ID not found in upload response');
      }

      // Step 3: Confirm upload completion
      const result = await confirmUpload({
        fileId: storageId as any, // Storage ID from upload response
        recordId: uploadData.fileId, // File record ID from generateUploadUrl
      });

      if (result.success) {
        // Use the file URL from confirmUpload result
        const fileUrl = result.fileUrl || '';
        
        setUploaded(true);
        setSelectedFile(null);
        onFileSelected?.(false);
        
        onUploadComplete?.(fileUrl, uploadData.fileId);
        if (!shouldSuppressAlerts) {
          Alert.alert('Success', 'Document uploaded successfully!');
        }
      } else {
        throw new Error(result.error || 'Upload confirmation failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      if (!shouldSuppressAlerts) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFile, documentType, generateUploadUrl, confirmUpload, onUploadComplete, onUploadError, onFileSelected, suppressAlerts]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setUploaded(false);
    onFileSelected?.(false);
  }, [onFileSelected]);

  // Expose upload method and file selection state via ref
  useImperativeHandle(ref, () => ({
    upload: (suppressUploadAlerts?: boolean) => uploadFile(suppressUploadAlerts),
    hasSelectedFile: () => !!selectedFile && !uploaded,
  }));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const documentInfo = getDocumentInfo();

  return (
    <View style={[styles.container, style]}>
      {uploaded ? (
        <View style={styles.uploadedContainer}>
          <View style={styles.uploadedContent}>
            <View style={styles.uploadedIconContainer}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.light.accent} />
            </View>
            <View style={styles.uploadedDetails}>
              <Text style={styles.uploadedTitle}>{documentInfo.title}</Text>
              <Text style={styles.uploadedStatus}>Uploaded successfully</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={removeFile}
            >
              <Ionicons name="close" size={16} color={Colors.light.error} />
            </TouchableOpacity>
          </View>
        </View>
      ) : !selectedFile ? (
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Ionicons name={documentInfo.icon} size={24} color={Colors.light.primary} />
          <Text style={styles.documentText}>{documentInfo.title}</Text>
          <Text style={styles.documentSubtext}>{documentInfo.subtitle}</Text>
          <View style={styles.uploadActions}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Ionicons name="camera" size={16} color={Colors.light.primary} />
              <Text style={styles.actionButtonText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={pickDocument}>
              <Ionicons name="document" size={16} color={Colors.light.primary} />
              <Text style={styles.actionButtonText}>File</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.filePreview}>
          <View style={styles.fileInfo}>
            <Ionicons name="document-text" size={20} color={Colors.light.primary} />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text style={styles.fileSize}>
                {formatFileSize(selectedFile.size)}
              </Text>
            </View>
          </View>
          
          <View style={styles.fileActions}>
            <TouchableOpacity 
              style={styles.uploadButtonSmall} 
              onPress={() => uploadFile()}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={16} color={Colors.light.background} />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={removeFile}
              disabled={uploading}
            >
              <Ionicons name="close" size={16} color={Colors.light.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  uploadButton: {
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
    color: Colors.light.text,
  },
  documentSubtext: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 16,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  filePreview: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  fileSize: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.background,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.error + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.accent,
  },
  uploadedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadedDetails: {
    flex: 1,
  },
  uploadedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  uploadedStatus: {
    fontSize: 12,
    color: Colors.light.accent,
    fontWeight: '500',
  },
});
