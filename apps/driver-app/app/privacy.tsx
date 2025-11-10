import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import type { Id } from '../../packages/convex/_generated/dataModel';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useUpdateDriverProfileMutation } from '../store/driverApi';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  
  const [updateDriverProfile, { isLoading: isUpdating }] = useUpdateDriverProfileMutation();

  // Initialize from driver's privacy settings
  type PrivacySettingsState = {
    locationSharing: boolean;
    analyticsTracking: boolean;
    marketingEmails: boolean;
    dataSharing: boolean;
  };

  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsState>({
    locationSharing: true,
    analyticsTracking: true,
    marketingEmails: false,
    dataSharing: false,
  });

  // Update when driver data changes
  useEffect(() => {
    if (driver?.privacySettings) {
      setPrivacySettings({
        locationSharing: driver.privacySettings.locationSharing ?? true,
        analyticsTracking: driver.privacySettings.analyticsTracking ?? true,
        marketingEmails: driver.privacySettings.marketingEmails ?? false,
        dataSharing: driver.privacySettings.dataSharing ?? false,
      });
    }
  }, [driver]);

  const handleBack = () => {
    router.back();
  };

  const toggleSetting = async (key: keyof typeof privacySettings) => {
    if (!driver) {
      Alert.alert('Error', 'Driver information not available.');
      return;
    }

    const newValue = !privacySettings[key];
    
    // Update local state immediately for responsive UI
    setPrivacySettings(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Auto-save to backend
    try {
      await updateDriverProfile({
        privacySettings: {
          locationSharing: privacySettings.locationSharing,
          analyticsTracking: privacySettings.analyticsTracking,
          marketingEmails: privacySettings.marketingEmails,
          dataSharing: privacySettings.dataSharing,
          [key]: newValue,
        },
      }).unwrap();
    } catch (error: any) {
      // Revert on error
      setPrivacySettings(prev => ({
        ...prev,
        [key]: !newValue
      }));
      const errorMessage = error?.data?.error?.message || error?.message || 'Failed to save setting. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Location & Tracking */}
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Location & Tracking</ThemedText>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="location-outline" size={24} color={Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold" style={styles.settingTitle}>Location Sharing</ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Share your location for order assignments
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={privacySettings.locationSharing}
                onValueChange={() => toggleSetting('locationSharing')}
                trackColor={{ false: Colors.light.secondary, true: Colors.light.primary }}
                thumbColor={privacySettings.locationSharing ? Colors.light.background : Colors.light.icon}
              />
            </View>
          </ThemedView>

          {/* Data & Analytics */}
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Data & Analytics</ThemedText>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="analytics-outline" size={24} color={Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold" style={styles.settingTitle}>Data Analytics</ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Help improve the app with anonymous usage data
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={privacySettings.analyticsTracking}
                onValueChange={() => toggleSetting('analyticsTracking')}
                trackColor={{ false: Colors.light.secondary, true: Colors.light.primary }}
                thumbColor={privacySettings.analyticsTracking ? Colors.light.background : Colors.light.icon}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="mail-outline" size={24} color={Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold" style={styles.settingTitle}>Marketing Emails</ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Receive promotional emails and offers
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={privacySettings.marketingEmails}
                onValueChange={() => toggleSetting('marketingEmails')}
                trackColor={{ false: Colors.light.secondary, true: Colors.light.primary }}
                thumbColor={privacySettings.marketingEmails ? Colors.light.background : Colors.light.icon}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="share-outline" size={24} color={Colors.light.primary} />
                <View style={styles.settingText}>
                  <ThemedText type="defaultSemiBold" style={styles.settingTitle}>Third-Party Sharing</ThemedText>
                  <ThemedText style={styles.settingDescription}>
                    Allow sharing data with trusted partners
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={privacySettings.dataSharing}
                onValueChange={() => toggleSetting('dataSharing')}
                trackColor={{ false: Colors.light.secondary, true: Colors.light.primary }}
                thumbColor={privacySettings.dataSharing ? Colors.light.background : Colors.light.icon}
              />
            </View>
          </ThemedView>

          {/* Privacy Policy */}
          <ThemedView style={styles.section}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.light.accent} />
              <View style={styles.infoContent}>
                <ThemedText type="defaultSemiBold" style={styles.infoTitle}>Your Privacy Matters</ThemedText>
                <ThemedText style={styles.infoDescription}>
                  We are committed to protecting your privacy and giving you control 
                  over your personal data. All data is encrypted and securely stored.
                </ThemedText>
              </View>
            </View>
            
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/privacy-policy')}>
              <ThemedText style={styles.actionButtonText}>View Privacy Policy</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          </ThemedView>
          
          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
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
  bottomSpacing: {
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  valueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
  },
  valueButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginRight: 4,
  },
  timeoutOptions: {
    marginTop: 12,
    paddingLeft: 36,
  },
  timeoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeoutOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  timeoutOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  timeoutOptionTextSelected: {
    color: Colors.light.primary,
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.light.icon,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.light.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
});