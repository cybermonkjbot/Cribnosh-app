import { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuperButton } from '@/components/ui/SuperButton';
import { useGetFamilyProfileQuery, useUpdateMemberPreferencesMutation } from '@/store/customerApi';
import { useToast } from '@/lib/ToastContext';

export default function MemberPreferencesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();
  const { data: familyProfileData } = useGetFamilyProfileQuery();
  const [updatePreferences, { isLoading }] = useUpdateMemberPreferencesMutation();

  const member = familyProfileData?.data?.family_members.find((m) => m.id === id);
  const [parentControlled, setParentControlled] = useState(true);

  useEffect(() => {
    // Load existing preferences if available
  }, [member]);

  const handleSubmit = async () => {
    if (!member) return;

    try {
      await updatePreferences({
        member_id: member.id,
        preferences: {
          parent_controlled: parentControlled,
        },
      }).unwrap();

      showToast({
        type: 'success',
        title: 'Preferences Updated',
        message: 'Member preferences have been updated successfully.',
        duration: 3000,
      });
      router.back();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.data?.message || error?.message || 'Failed to update preferences. Please try again.',
        duration: 4000,
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Preferences',
        }}
      />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        <ScreenHeader title="Preferences" onBack={() => router.back()} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.description}>
            Manage allergy and dietary preferences for {member?.name || 'this member'}
          </Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Parent Controlled</Text>
            <Text style={styles.settingDescription}>
              When enabled, you control all preferences for this member
            </Text>
            <TouchableOpacity
              style={[styles.toggle, parentControlled && styles.toggleActive]}
              onPress={() => setParentControlled(!parentControlled)}
            >
              <Text style={styles.toggleText}>{parentControlled ? 'Enabled' : 'Disabled'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Allergy and dietary preference management will be available here. You can add, remove, and manage preferences for this family member.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <SuperButton
            title={isLoading ? 'Updating...' : 'Save Preferences'}
            onPress={handleSubmit}
            backgroundColor="#094327"
            textColor="white"
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  description: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLabel: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  settingDescription: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  toggle: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#094327',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFFFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

