import { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { GradientBackground } from '@/components/ui/GradientBackground';
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
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#E6FFE8" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Preferences</Text>
          <Text style={styles.description}>
            Manage allergy and dietary preferences for {member?.name}
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

        <SuperButton
          title={isLoading ? 'Updating...' : 'Save Preferences'}
          onPress={handleSubmit}
          backgroundColor="#094327"
          textColor="white"
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#E6FFE8',
    fontSize: 16,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    color: '#E6FFE8',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
  },
  description: {
    color: '#C0DCC0',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  settingCard: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  settingLabel: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#C0DCC0',
    fontSize: 14,
    marginBottom: 12,
  },
  toggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#094327',
  },
  toggleText: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(230, 255, 232, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.1)',
  },
  infoText: {
    color: '#C0DCC0',
    fontSize: 14,
    lineHeight: 20,
  },
});

