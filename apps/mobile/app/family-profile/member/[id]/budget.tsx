import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuperButton } from '@/components/ui/SuperButton';
import { useToast } from '@/lib/ToastContext';
import { useFamilyProfile } from '@/hooks/useFamilyProfile';

export default function MemberBudgetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();
  const { getFamilyProfile } = useFamilyProfile();
  const [familyProfileData, setFamilyProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch family profile from Convex
  const fetchFamilyProfile = useCallback(async () => {
    try {
      const result = await getFamilyProfile();
      if (result.success) {
        setFamilyProfileData({
          data: result.data,
        });
      }
    } catch (error: any) {
      console.error('Error fetching family profile:', error);
    }
  }, [getFamilyProfile]);

  useEffect(() => {
    fetchFamilyProfile();
  }, [fetchFamilyProfile]);

  const member = familyProfileData?.data?.family_members.find((m) => m.id === id);
  const [dailyLimit, setDailyLimit] = useState('');
  const [weeklyLimit, setWeeklyLimit] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');

  useEffect(() => {
    if (member?.budget_settings) {
      setDailyLimit(member.budget_settings.daily_limit?.toString() || '');
      setWeeklyLimit(member.budget_settings.weekly_limit?.toString() || '');
      setMonthlyLimit(member.budget_settings.monthly_limit?.toString() || '');
    }
  }, [member]);

  const handleSubmit = async () => {
    if (!member) return;

    try {
      setIsLoading(true);
      // TODO: Implement updateMemberBudget via Convex action when available
      // For now, show a message that this feature is coming soon
      showToast({
        type: 'info',
        title: 'Coming Soon',
        message: 'Member budget update will be available soon via Convex.',
        duration: 3000,
      });
      // router.back();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.message || 'Failed to update budget. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Budget Settings',
        }}
      />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        <ScreenHeader title="Budget Settings" onBack={() => router.back()} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.description}>
            Set spending limits for {member?.name || 'this member'}. Leave empty to remove limits.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Limit (£)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 50"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={dailyLimit}
              onChangeText={setDailyLimit}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Weekly Limit (£)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 200"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={weeklyLimit}
              onChangeText={setWeeklyLimit}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Limit (£)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={monthlyLimit}
              onChangeText={setMonthlyLimit}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
        <SuperButton
          title={isLoading ? 'Updating...' : 'Save Budget'}
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    color: '#111827',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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

