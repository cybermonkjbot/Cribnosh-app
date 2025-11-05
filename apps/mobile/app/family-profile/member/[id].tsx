import { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, DollarSign, Heart, Package } from 'lucide-react-native';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useGetFamilyProfileQuery } from '@/store/customerApi';

export default function FamilyMemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { data: familyProfileData, isLoading } = useGetFamilyProfileQuery();

  const member = familyProfileData?.data?.family_members.find((m) => m.id === id);

  if (isLoading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E6FFE8" />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!member) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#E6FFE8" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Member not found</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

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
          <View style={styles.memberHeader}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberInitials}>
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRelationship}>{member.relationship}</Text>
          </View>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/family-profile/member/${id}/budget`)}
          >
            <DollarSign size={24} color="#E6FFE8" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Budget Settings</Text>
              <Text style={styles.actionDescription}>Manage spending limits</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/family-profile/member/${id}/preferences`)}
          >
            <Heart size={24} color="#E6FFE8" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Preferences</Text>
              <Text style={styles.actionDescription}>Allergies and dietary preferences</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/family-profile/member/${id}/orders`)}
          >
            <Package size={24} color="#E6FFE8" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Order History</Text>
              <Text style={styles.actionDescription}>View all orders placed by this member</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#E6FFE8',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  memberHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  memberAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#094327',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberInitials: {
    color: '#E6FFE8',
    fontSize: 32,
    fontWeight: 'bold',
  },
  memberName: {
    color: '#E6FFE8',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberRelationship: {
    color: '#C0DCC0',
    fontSize: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  actionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    color: '#C0DCC0',
    fontSize: 14,
  },
});

