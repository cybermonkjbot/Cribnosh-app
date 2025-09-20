import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Data sharing icons
const dataIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L2 7L10 12L18 7L10 2Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 17L10 22L18 17" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 12L10 17L18 12" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function ManageDataSharingScreen() {
  const router = useRouter();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Manage Data Sharing'
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
          <Text style={styles.mainTitle}>Manage Data Sharing</Text>
          


          {/* Data Sharing Settings */}
          <View style={styles.section}>
            
            <View style={styles.dataCategoryItem}>
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIcon}>
                  <SvgXml xml={analyticsIconSVG} width={20} height={20} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>Analytics</Text>
                  <Text style={styles.categorySubtitle}>Help improve app performance and identify issues</Text>
                </View>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor={analyticsEnabled ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <View style={styles.dataCategoryItem}>
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIcon}>
                  <SvgXml xml={personalizationIconSVG} width={20} height={20} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>Personalization</Text>
                  <Text style={styles.categorySubtitle}>Customize your experience and recommendations</Text>
                </View>
              </View>
              <Switch
                value={personalizationEnabled}
                onValueChange={setPersonalizationEnabled}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor={personalizationEnabled ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>

            <View style={styles.dataCategoryItem}>
              <View style={styles.categoryLeft}>
                <View style={styles.categoryIcon}>
                  <SvgXml xml={marketingIconSVG} width={20} height={20} />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>Marketing Communications</Text>
                  <Text style={styles.categorySubtitle}>Receive relevant offers and updates</Text>
                </View>
              </View>
              <Switch
                value={marketingEnabled}
                onValueChange={setMarketingEnabled}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor={marketingEnabled ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
            

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
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#1F2937',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 12,
  },
  // Info Card Styles
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0B9E58',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  // Data Category Styles
  dataCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6FFE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryText: {
    flex: 1,
    marginRight: 24,
  },
  categoryTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  toggleContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6B7280',
    alignSelf: 'flex-end',
  },
  toggleInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  // Detail Item Styles
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6FFE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  // Privacy Card Styles
  privacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  privacyTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    marginBottom: 8,
  },
  privacyText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  privacyLink: {
    alignSelf: 'flex-start',
  },
  privacyLinkText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#FF3B30',
  },
});
