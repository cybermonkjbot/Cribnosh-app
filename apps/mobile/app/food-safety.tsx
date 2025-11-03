import {
  useGetAllergiesQuery,
  useGetDietaryPreferencesQuery,
  useUpdateAllergiesMutation,
  useUpdateCrossContaminationSettingMutation,
  useUpdateDietaryPreferencesMutation,
} from '@/store/customerApi';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Icons
const allergyIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#FF6B6B"/>
  <path d="M19 15L19.5 16.5L21 17L19.5 17.5L19 19L18.5 17.5L17 17L18.5 16.5L19 15Z" fill="#FF6B6B"/>
  <path d="M5 15L5.5 16.5L7 17L5.5 17.5L5 19L4.5 17.5L3 17L4.5 16.5L5 15Z" fill="#FF6B6B"/>
</svg>`;

const dietIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#4CAF50"/>
  <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 18 12 18Z" fill="#4CAF50"/>
</svg>`;

const crossContaminationIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 3L21 21M21 3L3 21" stroke="#FF9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#FF9800"/>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const plusIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 4V16M4 10H16" stroke="#0B9E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function FoodSafetyScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  // Fetch food safety data from API
  const { data: allergiesData } = useGetAllergiesQuery(undefined, {
    skip: false, // Backend endpoint needed: GET /customer/allergies
  });

  const { data: dietaryPreferencesData } = useGetDietaryPreferencesQuery(undefined, {
    skip: false, // Backend endpoint needed: GET /customer/dietary-preferences
  });

  const [updateAllergies] = useUpdateAllergiesMutation();
  const [updateDietaryPreferences] = useUpdateDietaryPreferencesMutation();
  const [updateCrossContamination] = useUpdateCrossContaminationSettingMutation();

  // Cross-contamination setting is separate from dietary preferences
  // For now, initialize from localStorage/cache or default to false
  // The actual setting would come from a separate endpoint if needed
  const [crossContaminationEnabled, setCrossContaminationEnabled] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleAllergiesSection = () => {
    // Show current allergies status if available
    const allergiesCount = allergiesData?.data?.length || 0;
    Alert.alert(
      'Allergies & Intolerances',
      allergiesCount > 0
        ? `You currently have ${allergiesCount} allergy/allergen(s) configured.\n\n• Select common allergens\n• Add custom allergens\n• Set severity levels\n• Manage your allergy profile`
        : 'Manage your allergies and intolerances:\n\n• Select common allergens\n• Add custom allergens\n• Set severity levels\n• Manage your allergy profile',
      [
        {
          text: 'Manage Allergies',
          onPress: () => {
            // In a real implementation, this would navigate to a detailed allergies screen
            // For now, show that backend integration is ready
            showToast({
              type: "info",
              title: "Allergies Management",
              message: "Detailed allergies management screen would open here.",
              duration: 3000,
            });
          },
        },
      ]
    );
  };

  const handleDietaryPreferences = () => {
    const preferences = dietaryPreferencesData?.data;
    const hasPreferences = preferences && preferences.length > 0;

    Alert.alert(
      'Dietary Preferences',
      hasPreferences
        ? 'You have dietary preferences configured.\n\n• Set vegetarian/vegan preferences\n• Choose religious dietary requirements\n• Select health-driven options\n• Customize your diet profile'
        : 'Configure your dietary preferences:\n\n• Set vegetarian/vegan preferences\n• Choose religious dietary requirements\n• Select health-driven options\n• Customize your diet profile',
      [
        {
          text: 'Set Preferences',
          onPress: () => {
            // In a real implementation, this would navigate to a detailed dietary preferences screen
            showToast({
              type: "info",
              title: "Dietary Preferences",
              message: "Detailed dietary preferences screen would open here.",
              duration: 3000,
            });
          },
        },
      ]
    );
  };

  const handleCrossContaminationToggle = async (value: boolean) => {
    try {
      await updateCrossContamination({ avoid_cross_contamination: value }).unwrap();
      setCrossContaminationEnabled(value);
      if (value) {
        Alert.alert(
          'Cross-Contamination Protection Enabled',
          'Kitchens will now avoid preparing your meals in areas that handle your allergens. This may limit some menu options but ensures your safety.',
          [{ text: 'Got it', style: 'default' }]
        );
      } else {
        showToast({
          type: "success",
          title: "Settings Updated",
          message: "Cross-contamination protection has been disabled.",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Error updating cross-contamination setting:", error);
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to update cross-contamination setting. Please try again.";
      showToast({
        type: "error",
        title: "Update Failed",
        message: errorMessage,
        duration: 4000,
      });
      // Revert the toggle on error
      setCrossContaminationEnabled(!value);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Food Safety'
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
          <Text style={styles.mainTitle}>Food Safety</Text>
          
          {/* Food Safety Settings */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.mainCard} onPress={handleAllergiesSection} activeOpacity={0.7}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Manage Allergies</Text>
                <Text style={styles.cardDescription}>
                  Select common allergens, add custom ones, and set severity levels
                </Text>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>



            <TouchableOpacity style={styles.mainCard} onPress={handleDietaryPreferences} activeOpacity={0.7}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Set Dietary Requirements</Text>
                <Text style={styles.cardDescription}>
                  Choose from vegetarian, vegan, halal, kosher, gluten-free, and health-driven options
                </Text>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            
            <View style={styles.toggleCard}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Avoid cross-contamination</Text>
                <Text style={styles.toggleDescription}>
                  Avoid meals prepared in kitchens handling your allergens
                </Text>
              </View>
              <Switch
                value={crossContaminationEnabled}
                onValueChange={handleCrossContaminationToggle}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor={crossContaminationEnabled ? '#FFFFFF' : '#FFFFFF'}
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
  section: {
    marginBottom: 40,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardContent: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 6,
  },
  cardDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subCardContent: {
    flex: 1,
    marginRight: 12,
  },
  subCardIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  subCardText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  subCardSubtext: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    marginTop: 2,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  preferenceChip: {
    backgroundColor: '#E6FFE8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0B9E58',
  },
  preferenceText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#094327',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  toggleDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },

});
