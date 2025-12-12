import { RelationshipSelectionSheet } from '@/components/ui/RelationshipSelectionSheet';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, Plus, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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
  isDuplicate?: boolean;
  isSelfEmail?: boolean;
}

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function FamilyProfileSetupScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState<FamilyMemberForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [relationshipSheetIndex, setRelationshipSheetIndex] = useState<number | null>(null);
  const [memberValidationStatus, setMemberValidationStatus] = useState<Map<number, MemberValidation>>(new Map());
  const validationTimeoutRef = useRef<Map<number, any>>(new Map());

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

  const checkDuplicateEmail = (email: string, currentIndex: number): boolean => {
    const normalizedEmail = email.toLowerCase().trim();
    return members.some((member, index) =>
      index !== currentIndex && member.email.toLowerCase().trim() === normalizedEmail
    );
  };

  const checkSelfEmail = (email: string): boolean => {
    if (!user?.email) return false;
    return email.toLowerCase().trim() === user.email.toLowerCase().trim();
  };

  const updateMember = (index: number, field: keyof FamilyMemberForm, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);

    // Clear validation status if email is changed
    if (field === 'email') {
      // Clear any pending validation timeout
      const timeout = validationTimeoutRef.current.get(index);
      if (timeout) {
        clearTimeout(timeout);
        validationTimeoutRef.current.delete(index);
      }

      // Clear validation status
      const newStatus = new Map(memberValidationStatus);
      newStatus.delete(index);
      setMemberValidationStatus(newStatus);

      // Check for duplicates and self-email immediately
      const normalizedEmail = value.toLowerCase().trim();
      if (normalizedEmail && normalizedEmail.includes('@')) {
        const isDuplicate = checkDuplicateEmail(value, index);
        const isSelfEmail = checkSelfEmail(value);

        if (isDuplicate || isSelfEmail) {
          const updatedStatus = new Map(memberValidationStatus);
          updatedStatus.set(index, {
            exists: false,
            isLoading: false,
            isDuplicate,
            isSelfEmail,
          });
          setMemberValidationStatus(updatedStatus);
        }
      }
    }
  };

  const performValidation = async (index: number, email: string) => {
    // Validate email format first
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return;
    }

    // Check for duplicates
    const isDuplicate = checkDuplicateEmail(email, index);
    if (isDuplicate) {
      const updatedStatus = new Map(memberValidationStatus);
      updatedStatus.set(index, {
        exists: false,
        isLoading: false,
        isDuplicate: true,
      });
      setMemberValidationStatus(updatedStatus);
      showToast({
        type: 'error',
        title: 'Duplicate Email',
        message: 'This email is already added to the family members list.',
        duration: 3000,
      });
      return;
    }

    // Check for self-email
    const isSelfEmail = checkSelfEmail(email);
    if (isSelfEmail) {
      const updatedStatus = new Map(memberValidationStatus);
      updatedStatus.set(index, {
        exists: false,
        isLoading: false,
        isSelfEmail: true,
      });
      setMemberValidationStatus(updatedStatus);
      showToast({
        type: 'error',
        title: 'Cannot Add Your Own Email',
        message: 'You cannot add yourself as a family member.',
        duration: 3000,
      });
      return;
    }

    // Set loading state
    const newStatus = new Map(memberValidationStatus);
    newStatus.set(index, { exists: false, isLoading: true, isDuplicate: false, isSelfEmail: false });
    setMemberValidationStatus(newStatus);

    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.users.customerValidateFamilyMemberEmail, {
        sessionToken,
        email: normalizedEmail,
      });

      if (result.success === false) {
        throw new Error(result.error || 'Failed to validate email');
      }

      // Update validation status
      const updatedStatus = new Map(memberValidationStatus);
      updatedStatus.set(index, {
        exists: result.exists || false,
        isLoading: false,
        isDuplicate: false,
        isSelfEmail: false,
      });
      setMemberValidationStatus(updatedStatus);
    } catch (error: any) {
      // On error, just don't show indicator - don't block the user
      const updatedStatus = new Map(memberValidationStatus);
      updatedStatus.set(index, {
        exists: false,
        isLoading: false,
        error: error?.message,
        isDuplicate: false,
        isSelfEmail: false,
      });
      setMemberValidationStatus(updatedStatus);
    }
  };

  const handleEmailBlur = async (index: number, email: string) => {
    // Clear any pending timeout
    const timeout = validationTimeoutRef.current.get(index);
    if (timeout) {
      clearTimeout(timeout);
      validationTimeoutRef.current.delete(index);
    }

    // Perform validation immediately on blur
    await performValidation(index, email);
  };

  const handleEmailChange = (index: number, email: string) => {
    updateMember(index, 'email', email);

    // Clear any pending validation timeout
    const timeout = validationTimeoutRef.current.get(index);
    if (timeout) {
      clearTimeout(timeout);
      validationTimeoutRef.current.delete(index);
    }

    // Debounce validation - wait 500ms after user stops typing
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail && normalizedEmail.includes('@')) {
      const newTimeout = setTimeout(() => {
        performValidation(index, email);
        validationTimeoutRef.current.delete(index);
      }, 500);
      validationTimeoutRef.current.set(index, newTimeout);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      validationTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      validationTimeoutRef.current.clear();
    };
  }, []);

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

    // Check for duplicate emails
    const emails = members.map(m => m.email.toLowerCase().trim());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      showToast({
        type: 'error',
        title: 'Duplicate Emails',
        message: 'Please remove duplicate email addresses from the family members list.',
        duration: 3000,
      });
      return false;
    }

    // Check for self-email
    if (user?.email) {
      const userEmail = user.email.toLowerCase().trim();
      const hasSelfEmail = members.some(m => m.email.toLowerCase().trim() === userEmail);
      if (hasSelfEmail) {
        showToast({
          type: 'error',
          title: 'Cannot Add Your Own Email',
          message: 'You cannot add yourself as a family member.',
          duration: 3000,
        });
        return false;
      }
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

  const handleNext = async () => {
    if (step === 1) {
      if (validateStep1()) {
        // Validate all emails before moving to review step
        const validationPromises = members.map((member, index) => {
          if (member.email.trim() && member.email.includes('@')) {
            return performValidation(index, member.email);
          }
          return Promise.resolve();
        });
        await Promise.all(validationPromises);
        setStep(2);
      }
    } else if (step === 2) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.users.customerSetupFamilyProfile, {
        sessionToken,
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
      });

      if (result.success === false) {
        throw new Error(result.error || 'Failed to create family profile');
      }

      showToast({
        type: 'success',
        title: 'Family Profile Created',
        message: 'Your family profile has been set up successfully!',
        duration: 3000,
      });
      router.replace('/family-profile/manage');
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Setup Failed',
        message: error?.message || 'Failed to create family profile. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.mainTitle}>Add Family Members</Text>
      <Text style={styles.stepDescription}>
        Add the family members you&apos;d like to share your account with. They&apos;ll receive an invitation to join.
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
              style={[
                styles.input,
                (getMemberValidation(index)?.isDuplicate || getMemberValidation(index)?.isSelfEmail) && styles.inputError,
              ]}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={member.email}
              onChangeText={(text) => handleEmailChange(index, text)}
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
              if (validation?.isDuplicate || validation?.isSelfEmail) {
                return (
                  <View style={styles.validationIndicator}>
                    <X size={20} color="#EF4444" />
                  </View>
                );
              }
              return null;
            })()}
          </View>
          {(() => {
            const validation = getMemberValidation(index);
            if (validation?.isDuplicate) {
              return (
                <Text style={styles.validationMessage}>
                  This email is already in the list
                </Text>
              );
            }
            if (validation?.isSelfEmail) {
              return (
                <Text style={styles.validationMessage}>
                  You cannot add your own email
                </Text>
              );
            }
            if (validation?.exists) {
              return (
                <Text style={styles.validationSuccessMessage}>
                  This member has a Cribnosh account. They&apos;ll receive an invitation to join.
                </Text>
              );
            }
            if (validation && !validation.isLoading && member.email.trim() && member.email.includes('@') && !validation.exists) {
              return (
                <Text style={styles.validationInfoMessage}>
                  This member will receive an invitation to create an account.
                </Text>
              );
            }
            return null;
          })()}

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
        {members.map((member, index) => {
          const validation = getMemberValidation(index);
          return (
            <View key={index} style={styles.reviewMember}>
              <View style={styles.reviewMemberHeader}>
                <Text style={styles.reviewMemberName}>{member.name}</Text>
                {validation?.exists && (
                  <View style={styles.reviewValidationBadge}>
                    <CheckCircle size={16} color="#094327" />
                    <Text style={styles.reviewValidationText}>Has Account</Text>
                  </View>
                )}
              </View>
              <Text style={styles.reviewMemberDetails}>
                {member.email} • {member.relationship}
              </Text>
              {validation?.exists && (
                <Text style={styles.reviewMemberNote}>
                  This member will receive an invitation to join.
                </Text>
              )}
              {validation && !validation.exists && !validation.isLoading && member.email.trim() && member.email.includes('@') && (
                <Text style={styles.reviewMemberNote}>
                  This member will receive an invitation to create an account.
                </Text>
              )}
            </View>
          );
        })}
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

        <ScreenHeader title="Family Profile Setup" onBack={handleBack} />

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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  validationMessage: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  validationSuccessMessage: {
    color: '#094327',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  validationInfoMessage: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
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
  reviewMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewMemberName: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    flex: 1,
  },
  reviewValidationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4FFF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  reviewValidationText: {
    color: '#094327',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  reviewMemberDetails: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    marginBottom: 4,
  },
  reviewMemberNote: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 4,
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

