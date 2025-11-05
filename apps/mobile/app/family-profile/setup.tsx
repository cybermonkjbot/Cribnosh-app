import { RelationshipSelectionSheet } from '@/components/ui/RelationshipSelectionSheet';
import { useToast } from '@/lib/ToastContext';
import { useSetupFamilyProfileMutation, useValidateFamilyMemberEmailMutation } from '@/store/customerApi';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface FamilyMemberForm {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

interface MemberValidation {
  exists: boolean;
  isLoading: boolean;
  error?: string;
}

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function FamilyProfileSetupScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<FamilyMemberForm[]>([]);
  const [setupFamilyProfile, { isLoading }] = useSetupFamilyProfileMutation();
  const [validateFamilyMemberEmail] = useValidateFamilyMemberEmailMutation();
  const [relationshipSheetIndex, setRelationshipSheetIndex] = useState<number | null>(null);
  const [memberValidationStatus, setMemberValidationStatus] = useState<Map<number, MemberValidation>>(new Map());

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const addMember = () => {
    setMembers([...members, { name: '', email: '', phone: '', relationship: '' }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof FamilyMemberForm, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
    
    // Clear validation status if email is changed
    if (field === 'email') {
      const newStatus = new Map(memberValidationStatus);
      newStatus.delete(index);
      setMemberValidationStatus(newStatus);
    }
  };

  const handleEmailBlur = async (index: number, email: string) => {
    // Validate email format first
    if (!email.trim() || !email.includes('@')) {
      return;
    }

    // Set loading state
    const newStatus = new Map(memberValidationStatus);
    newStatus.set(index, { exists: false, isLoading: true });
    setMemberValidationStatus(newStatus);

    try {
      const result = await validateFamilyMemberEmail({ email: email.trim() }).unwrap();
      
      // Update validation status
      const updatedStatus = new Map(memberValidationStatus);
      updatedStatus.set(index, {
        exists: result.data?.exists || false,
        isLoading: false,
      });
      setMemberValidationStatus(updatedStatus);
    } catch (error: any) {
      // On error, just don't show indicator - don't block the user
      const updatedStatus = new Map(memberValidationStatus);
      updatedStatus.set(index, {
        exists: false,
        isLoading: false,
        error: error?.message,
      });
      setMemberValidationStatus(updatedStatus);
    }
  };

  const getMemberValidation = (index: number): MemberValidation | undefined => {
    return memberValidationStatus.get(index);
  };

  const handleOpenRelationshipSheet = (index: number) => {
    setRelationshipSheetIndex(index);
  };

  const handleCloseRelationshipSheet = () => {
    setRelationshipSheetIndex(null);
  };

  const handleSelectRelationship = (index: number, relationship: string) => {
    updateMember(index, 'relationship', relationship);
  };

  const validateStep1 = () => {
    if (members.length === 0) {
      showToast({
        type: 'error',
        title: 'Add Family Members',
        message: 'Please add at least one family member to continue.',
        duration: 3000,
      });
      return false;
    }

    for (const member of members) {
      if (!member.name.trim()) {
        showToast({
          type: 'error',
          title: 'Missing Information',
          message: 'Please enter a name for all family members.',
          duration: 3000,
        });
        return false;
      }
      if (!member.email.trim() || !member.email.includes('@')) {
        showToast({
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid email address for all family members.',
          duration: 3000,
        });
        return false;
      }
      if (!member.relationship.trim()) {
        showToast({
          type: 'error',
          title: 'Missing Relationship',
          message: 'Please specify the relationship for all family members.',
          duration: 3000,
        });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await setupFamilyProfile({
        family_members: members.map((m) => ({
          name: m.name.trim(),
          email: m.email.trim(),
          phone: m.phone.trim() || undefined,
          relationship: m.relationship.trim(),
        })),
        settings: {
          shared_payment_methods: true,
          shared_orders: true,
          allow_child_ordering: true,
          require_approval_for_orders: false,
          spending_notifications: true,
        },
      }).unwrap();

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Family Profile Created',
          message: 'Your family profile has been set up successfully!',
          duration: 3000,
        });
        router.replace('/family-profile/manage');
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Setup Failed',
        message: error?.data?.message || error?.message || 'Failed to create family profile. Please try again.',
        duration: 4000,
      });
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.mainTitle}>Add Family Members</Text>
      <Text style={styles.stepDescription}>
        Add the family members you'd like to share your account with. They'll receive an invitation to join.
      </Text>

      {members.map((member, index) => (
        <View key={index} style={styles.memberCard}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberNumber}>Member {index + 1}</Text>
            {members.length > 1 && (
              <TouchableOpacity onPress={() => removeMember(index)} style={styles.removeButton}>
                <X size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#9CA3AF"
            value={member.name}
            onChangeText={(text) => updateMember(index, 'name', text)}
          />

          <View style={styles.emailInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={member.email}
              onChangeText={(text) => updateMember(index, 'email', text)}
              onBlur={() => handleEmailBlur(index, member.email)}
            />
            {(() => {
              const validation = getMemberValidation(index);
              if (validation?.isLoading) {
                return (
                  <View style={styles.validationIndicator}>
                    <ActivityIndicator size="small" color="#094327" />
                  </View>
                );
              }
              if (validation?.exists) {
                return (
                  <View style={styles.validationIndicator}>
                    <CheckCircle size={20} color="#094327" />
                  </View>
                );
              }
              return null;
            })()}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={member.phone}
            onChangeText={(text) => updateMember(index, 'phone', text)}
          />

          <TouchableOpacity
            style={styles.relationshipSelector}
            onPress={() => handleOpenRelationshipSheet(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.relationshipSelectorText,
                !member.relationship && styles.relationshipSelectorPlaceholder,
              ]}
            >
              {member.relationship || 'Select Relationship'}
            </Text>
            <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addMember} style={styles.addButton}>
        <Plus size={20} color="#094327" />
        <Text style={styles.addButtonText}>Add Another Member</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.mainTitle}>Review & Confirm</Text>
      <Text style={styles.stepDescription}>
        Review your family profile setup. Invitations will be sent to all members.
      </Text>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Family Members ({members.length})</Text>
        {members.map((member, index) => (
          <View key={index} style={styles.reviewMember}>
            <Text style={styles.reviewMemberName}>{member.name}</Text>
            <Text style={styles.reviewMemberDetails}>
              {member.email} • {member.relationship}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Shared Payment Methods</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Allow Child Ordering</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Spending Notifications</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Family Profile Setup'
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

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 2) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {step} of 2</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </ScrollView>

        <SafeAreaView style={styles.buttonContainer} edges={['bottom']}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {step === 2 ? (isLoading ? 'Creating...' : 'Create Family Profile') : 'Continue'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Relationship Selection Sheet */}
        {relationshipSheetIndex !== null && (
          <RelationshipSelectionSheet
            isVisible={relationshipSheetIndex !== null}
            onClose={handleCloseRelationshipSheet}
            selectedRelationship={members[relationshipSheetIndex]?.relationship || ''}
            onSelectRelationship={(relationship) =>
              handleSelectRelationship(relationshipSheetIndex, relationship)
            }
          />
        )}
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#094327',
    borderRadius: 2,
  },
  progressText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flex: 1,
    paddingBottom: 120,
  },
  relationshipSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 48,
  },
  relationshipSelectorText: {
    color: '#094327',
    fontSize: 16,
    fontFamily: 'Inter',
    flex: 1,
  },
  relationshipSelectorPlaceholder: {
    color: '#9CA3AF',
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 8,
  },
  stepDescription: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberNumber: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  removeButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    color: '#094327',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'Inter',
    flex: 1,
  },
  emailInputContainer: {
    position: 'relative',
  },
  validationIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButtonText: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reviewTitle: {
    color: '#094327',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Archivo',
  },
  reviewMember: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewMemberName: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  reviewMemberDetails: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  settingsTitle: {
    color: '#094327',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Archivo',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  settingValue: {
    color: '#094327',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFFFA',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Archivo',
  },
});

