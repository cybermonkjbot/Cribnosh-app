import {
  useGetDataSharingPreferencesQuery,
  useUpdateDataSharingPreferencesMutation,
} from '@/store/customerApi';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const analyticsIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 3V17H17" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7 14L10 11L13 14L17 10" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const personalizationIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 20C20 15.5817 15.5228 12 10 12C4.47715 12 0 15.5817 0 20" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const marketingIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L2 7L10 12L18 7L10 2Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 17L10 22L18 17" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 12L10 17L18 12" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const linkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 13C10.5304 13 11.0391 12.7893 11.4142 12.4142C11.7893 12.0391 12 11.5304 12 11C12 10.4696 11.7893 9.96086 11.4142 9.58579C11.0391 9.21071 10.5304 9 10 9H7C6.46957 9 5.96086 9.21071 5.58579 9.58579C5.21071 9.96086 5 10.4696 5 11C5 11.5304 5.21071 12.0391 5.58579 12.4142C5.96086 12.7893 6.46957 13 7 13H10Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 7C13.5304 7 14.0391 7.21071 14.4142 7.58579C14.7893 7.96086 15 8.46957 15 9C15 9.53043 14.7893 10.0391 14.4142 10.4142C14.0391 10.7893 13.5304 11 13 11H10" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function PrivacyScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // Fetch data sharing preferences from API
  const { data: dataSharingData, isLoading } = useGetDataSharingPreferencesQuery(undefined, {
    skip: false,
  });

  const [updateDataSharing] = useUpdateDataSharingPreferencesMutation();

  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    dataSharingData?.data?.analytics_enabled ?? true
  );
  const [personalizationEnabled, setPersonalizationEnabled] = useState(
    dataSharingData?.data?.personalization_enabled ?? true
  );
  const [marketingEnabled, setMarketingEnabled] = useState(
    dataSharingData?.data?.marketing_enabled ?? false
  );

  // Sync state with API data when it loads
  useEffect(() => {
    if (dataSharingData?.data) {
      setAnalyticsEnabled(dataSharingData.data.analytics_enabled);
      setPersonalizationEnabled(dataSharingData.data.personalization_enabled);
      setMarketingEnabled(dataSharingData.data.marketing_enabled);
    }
  }, [dataSharingData]);

  const handleBack = () => {
    router.back();
  };

  const handleUpdateDataSharing = async (
    field: 'analytics' | 'personalization' | 'marketing',
    value: boolean
  ) => {
    try {
      const updateData: any = {
        analytics_enabled: analyticsEnabled,
        personalization_enabled: personalizationEnabled,
        marketing_enabled: marketingEnabled,
      };

      updateData[`${field}_enabled`] = value;

      await updateDataSharing(updateData).unwrap();

      showToast({
        type: 'success',
        title: 'Settings Updated',
        message: 'Your privacy preferences have been updated.',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error updating data sharing preferences:', error);
      // Revert on error
      if (field === 'analytics') setAnalyticsEnabled(!value);
      if (field === 'personalization') setPersonalizationEnabled(!value);
      if (field === 'marketing') setMarketingEnabled(!value);

      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to update preferences. Please try again.';
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 4000,
      });
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    const url = 'https://cribnosh.com/privacy';
    try {
      // Try to open the URL directly - canOpenURL can be unreliable in simulators
      await Linking.openURL(url);
    } catch (error: any) {
      // Only show error if it's a real failure, not just a simulator limitation
      const errorMessage = error?.message || String(error);
      if (!errorMessage.includes('Unable to open URL')) {
        console.error('Error opening privacy policy:', error);
        showToast({
          type: 'error',
          title: 'Unable to Open',
          message: 'Could not open privacy policy link. Please try again later.',
          duration: 3000,
        });
      }
      // In simulator, the error is expected - just log it
      console.warn('Privacy policy URL opening failed (may be expected in simulator):', errorMessage);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: 'Privacy',
          }}
        />
        <SafeAreaView style={styles.mainContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Privacy',
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
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Privacy</Text>

          {/* Data Sharing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>
            <Text style={styles.sectionDescription}>
              Control how your data is used to improve your experience
            </Text>

            {/* Analytics */}
            <View style={styles.dataCategoryItem}>
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIcon}>
                  <SvgXml xml={analyticsIconSVG} width={20} height={20} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>Analytics</Text>
                  <Text style={styles.categorySubtitle}>
                    Help improve app performance and identify issues
                  </Text>
                </View>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={(value) => {
                  setAnalyticsEnabled(value);
                  handleUpdateDataSharing('analytics', value);
                }}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Personalization */}
            <View style={styles.dataCategoryItem}>
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIcon}>
                  <SvgXml xml={personalizationIconSVG} width={20} height={20} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>Personalization</Text>
                  <Text style={styles.categorySubtitle}>
                    Customize your experience and recommendations
                  </Text>
                </View>
              </View>
              <Switch
                value={personalizationEnabled}
                onValueChange={(value) => {
                  setPersonalizationEnabled(value);
                  handleUpdateDataSharing('personalization', value);
                }}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            {/* Marketing */}
            <View style={styles.dataCategoryItem}>
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIcon}>
                  <SvgXml xml={marketingIconSVG} width={20} height={20} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>Marketing Communications</Text>
                  <Text style={styles.categorySubtitle}>
                    Receive relevant offers and updates
                  </Text>
                </View>
              </View>
              <Switch
                value={marketingEnabled}
                onValueChange={(value) => {
                  setMarketingEnabled(value);
                  handleUpdateDataSharing('marketing', value);
                }}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* Privacy Policy Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.linkItem}
              onPress={handleOpenPrivacyPolicy}
              activeOpacity={0.7}
            >
              <View style={styles.linkItemLeft}>
                <View style={styles.linkIcon}>
                  <SvgXml xml={linkIconSVG} width={20} height={20} />
                </View>
                <View style={styles.linkText}>
                  <Text style={styles.linkTitle}>Privacy Policy</Text>
                  <Text style={styles.linkSubtitle}>Read our privacy policy</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  mainTitle: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  dataCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  linkItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  linkText: {
    flex: 1,
  },
  linkTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  linkSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});

