import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';
import { useToast } from '@/lib/ToastContext';
import { useInviteFamilyMemberMutation } from '@/store/customerApi';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface AddFamilyMemberSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddFamilyMemberSheet({
  isVisible,
  onClose,
  onSuccess,
}: AddFamilyMemberSheetProps) {
  const { showToast } = useToast();
  const [inviteMember, { isLoading }] = useInviteFamilyMemberMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      handleClose();
    }
  }, []);

  const handleClose = useCallback(() => {
    setName('');
    setEmail('');
    setPhone('');
    setRelationship('');
    onClose();
  }, [onClose]);

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
        handleClose();
        onSuccess?.();
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

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={0}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={{
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Family Member</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Send Invitation</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'Inter',
  },
  submitButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

