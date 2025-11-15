import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';
import { useToast } from '../../lib/ToastContext';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Download icon SVG
const downloadIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2V14M10 14L6 10M10 14L14 10" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 17V18C3 18.5523 3.44772 19 4 19H16C16.5523 19 17 18.5523 17 18V17" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface DownloadAccountDataSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function DownloadAccountDataSheet({
  isVisible,
  onClose,
}: DownloadAccountDataSheetProps) {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  // Request account data download function
  const downloadAccountData = useCallback(async () => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const result = await convex.action(api.actions.users.customerRequestAccountDataDownload, {
      sessionToken,
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to request account data download');
    }

    // Transform to match expected format
    return {
      data: {
        download_url: result.download_url,
        download_token: result.download_token,
        status: result.status,
        estimated_completion_time: result.estimated_completion_time,
      },
    };
  }, []);

  const snapPoints = useMemo(() => ['85%', '100%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleDownloadData = async () => {
    try {
      setIsDownloading(true);
      const result = await downloadAccountData();
      setIsDownloading(false);
      
      if (result.data?.download_url) {
        showToast({
          type: "success",
          title: "Download Ready",
          message: "Your account data is ready for download. It will be sent to your registered email within 24-48 hours.",
          duration: 5000,
        });
        onClose();
      } else {
        showToast({
          type: "success",
          title: "Request Submitted",
          message: "Your data download request has been submitted. You'll receive an email when it's ready.",
          duration: 5000,
        });
        onClose();
      }
    } catch (error: any) {
      setIsDownloading(false);
      console.error("Error downloading account data:", error);
      const errorMessage = 
        error?.message ||
        "Failed to initiate data download. Please try again.";
      showToast({
        type: "error",
        title: "Download Failed",
        message: errorMessage,
        duration: 4000,
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={0}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      bottomInset={0}
      backgroundStyle={{
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Download Account Data</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close"
            accessibilityHint="Closes the download account data sheet"
          >
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.description}>
            Get a complete copy of your personal data including profile, orders, and activity.
          </Text>
          
          <TouchableOpacity
            style={[styles.primaryDownloadButton, isDownloading && styles.primaryDownloadButtonDisabled]}
            onPress={handleDownloadData}
            disabled={isDownloading}
            activeOpacity={0.8}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SvgXml xml={downloadIconSVG} width={20} height={20} />
            )}
            <Text style={styles.primaryDownloadButtonText}>
              {isDownloading ? "Preparing Download..." : "Download All Data"}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.downloadNote}>
            Your data will be prepared and sent to your email within 24-48 hours.
          </Text>
        </ScrollView>
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  description: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 32,
  },
  primaryDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryDownloadButtonDisabled: {
    opacity: 0.6,
  },
  primaryDownloadButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  downloadNote: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
});

