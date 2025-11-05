import { GradientBackground } from '@/components/ui/GradientBackground';
import { SuperButton } from '@/components/ui/SuperButton';
import { useToast } from '@/lib/ToastContext';
import { useInviteFamilyMemberMutation } from '@/store/customerApi';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [inviteMember, { isLoading }] = useInviteFamilyMemberMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !relationship.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in all required fields.',
        duration: 3000,
      });
      return;
    }

    if (!email.includes('@')) {
      showToast({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        duration: 3000,
      });
      return;
    }

    try {
      const result = await inviteMember({
        member: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          relationship: relationship.trim(),
        },
      }).unwrap();

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Invitation Sent',
          message: 'Family member invitation has been sent successfully!',
          duration: 3000,
        });
        router.back();
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Invitation Failed',
        message: error?.data?.message || error?.message || 'Failed to send invitation. Please try again.',
        duration: 4000,
      });
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#007AFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Add Family Member</Text>
          <Text style={styles.description}>
            Invite a new family member to join your family profile. They'll receive an invitation email.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g., Spouse, Child, Parent)"
            placeholderTextColor="#9CA3AF"
            value={relationship}
            onChangeText={setRelationship}
          />
        </ScrollView>

        <SuperButton
          title={isLoading ? 'Sending...' : 'Send Invitation'}
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
    color: '#007AFF',
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#E6FFE8',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
});

