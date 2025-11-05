import { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { SuperButton } from '@/components/ui/SuperButton';
import { useGetFamilyProfileQuery, useUpdateMemberBudgetMutation } from '@/store/customerApi';
import { useToast } from '@/lib/ToastContext';

export default function MemberBudgetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();
  const { data: familyProfileData } = useGetFamilyProfileQuery();
  const [updateBudget, { isLoading }] = useUpdateMemberBudgetMutation();

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
      await updateBudget({
        member_id: member.id,
        budget_settings: {
          daily_limit: dailyLimit ? parseFloat(dailyLimit) : undefined,
          weekly_limit: weeklyLimit ? parseFloat(weeklyLimit) : undefined,
          monthly_limit: monthlyLimit ? parseFloat(monthlyLimit) : undefined,
          currency: 'gbp',
        },
      }).unwrap();

      showToast({
        type: 'success',
        title: 'Budget Updated',
        message: 'Budget limits have been updated successfully.',
        duration: 3000,
      });
      router.back();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.data?.message || error?.message || 'Failed to update budget. Please try again.',
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
          <Text style={styles.title}>Budget Settings</Text>
          <Text style={styles.description}>
            Set spending limits for {member?.name}. Leave empty to remove limits.
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

        <SuperButton
          title={isLoading ? 'Updating...' : 'Save Budget'}
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#E6FFE8',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
});

