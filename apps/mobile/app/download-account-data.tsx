import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import * as FileSystem from 'expo-file-system';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Data download icons
const downloadIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2V14M10 14L6 10M10 14L14 10" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 17V18C3 18.5523 3.44772 19 4 19H16C16.5523 19 17 18.5523 17 18V17" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;



export default function DownloadAccountDataScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const insets = useSafeAreaInsets();
  const { token } = useAuthContext();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const handleBack = () => {
    router.back();
  };

  const handleDownloadData = async () => {
    if (!isMountedRef.current) return;
    try {
      if (isMountedRef.current) {
        setIsDownloading(true);
      }
      const result = await downloadAccountData();

      if (!isMountedRef.current) return;

      if (result.data?.download_url) {
        // Download the file from the URL
        const downloadUrl = result.data.download_url;
        const fileName = `cribnosh-account-data-${Date.now()}.zip`;
        const fileUri = `${(FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || ''}${fileName}`;

        // Download the file
        const downloadResult = await FileSystem.downloadAsync(
          downloadUrl,
          fileUri,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!isMountedRef.current) return;

        if (downloadResult.status === 200) {
          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();

          if (!isMountedRef.current) return;

          if (isAvailable) {
            // Share/open the file
            await Sharing.shareAsync(downloadResult.uri, {
              mimeType: 'application/zip',
              dialogTitle: 'Save Account Data',
            });

            if (isMountedRef.current) {
              showToast({
                type: "success",
                title: "Download Complete",
                message: "Your account data has been downloaded successfully.",
                duration: 5000,
              });
            }
          } else {
            // Fallback: show success message
            if (isMountedRef.current) {
              showToast({
                type: "success",
                title: "Download Complete",
                message: `Your account data has been saved to: ${downloadResult.uri}`,
                duration: 5000,
              });
            }
          }
        } else {
          throw new Error(`Download failed with status: ${downloadResult.status}`);
        }
      } else {
        if (isMountedRef.current) {
          showToast({
            type: "success",
            title: "Request Submitted",
            message: "Your data download request has been submitted. You'll receive an email when it's ready.",
            duration: 5000,
          });
        }
      }
    } catch (error: any) {
      console.error("Error downloading account data:", error);
      if (!isMountedRef.current) return;
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to download account data. Please try again.";
      if (isMountedRef.current) {
        showToast({
          type: "error",
          title: "Download Failed",
          message: errorMessage,
          duration: 4000,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsDownloading(false);
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Download Account Data'
        }}
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />

        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title */}
          <Text style={styles.mainTitle}>Download Account Data</Text>

          {/* Download Section */}
          <View style={styles.downloadSection}>
            <Text style={styles.sectionDescription}>
              Get a complete copy of your personal data including profile, orders, and activity.
            </Text>
            <Text style={styles.downloadNote}>
              Your data will be prepared and sent to your email within 24-48 hours.
            </Text>
          </View>
        </ScrollView>

        {/* Floating Download Button */}
        <View style={[styles.floatingButtonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.floatingButton, isDownloading && { opacity: 0.6 }]}
            onPress={handleDownloadData}
            disabled={isDownloading}
          >
            <SvgXml xml={downloadIconSVG} width={20} height={20} />
            <Text style={styles.floatingButtonText}>
              {isDownloading ? "Preparing Download..." : "Download All Data"}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#1F2937',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 24,
  },
  downloadSection: {
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 24,
  },
  sectionDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'left',
  },
  // Security Link
  securityLink: {
    alignSelf: 'flex-start',
  },
  securityLinkText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#FF3B30',
  },

  downloadNote: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    marginTop: 20,
    textAlign: 'left',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#FAFFFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    marginLeft: 12,
  },
});
