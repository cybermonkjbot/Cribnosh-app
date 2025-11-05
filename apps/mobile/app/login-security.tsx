import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import {
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
} from '@/store/customerApi';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const lockIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16.6402 10.845C16.6402 10.3866 16.2686 10.015 15.8102 10.015L4.1902 10.015C3.7318 10.015 3.3602 10.3866 3.3602 10.845L3.3602 16.655C3.3602 17.1134 3.7318 17.485 4.1902 17.485L15.8102 17.485C16.2686 17.485 16.6402 17.1134 16.6402 16.655V10.845ZM18.3002 16.655C18.3002 18.0302 17.1854 19.145 15.8102 19.145L4.1902 19.145C2.81501 19.145 1.7002 18.0302 1.7002 16.655L1.7002 10.845C1.7002 9.46975 2.81501 8.35498 4.1902 8.35498L15.8102 8.35498C17.1854 8.35498 18.3002 9.46975 18.3002 10.845L18.3002 16.655Z" fill="#6B7280"/>
  <path d="M13.32 9.15498V5.83498C13.32 4.95446 12.97 4.11026 12.3473 3.48764C11.7248 2.86502 10.8806 2.51498 10 2.51498C9.11947 2.51498 8.2753 2.86502 7.65268 3.48764C7.03006 4.11026 6.68002 4.95446 6.68002 5.83498L6.68002 9.15498C6.68002 9.61339 6.30841 9.98498 5.85002 9.98498C5.39163 9.98498 5.02002 9.61339 5.02002 9.15498L5.02002 5.83498C5.02002 4.5142 5.54507 3.2479 6.479 2.31396C7.41293 1.38003 8.67924 0.85498 10 0.85498C11.3208 0.85498 12.5871 1.38003 13.521 2.31396C14.455 3.2479 14.98 4.5142 14.98 5.83498V9.15498C14.98 9.61339 14.6084 9.98498 14.15 9.98498C13.6916 9.98498 13.32 9.61339 13.32 9.15498Z" fill="#6B7280"/>
</svg>`;

const deviceIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 3H15C15.5523 3 16 3.44772 16 4V16C16 16.5523 15.5523 17 15 17H5C4.44772 17 4 16.5523 4 16V4C4 3.44772 4.44772 3 5 3Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 1V3M12 1V3M10 13H10.01" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const shieldIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L2 7L10 12L18 7L10 2Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 17L10 22L18 17" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 12L10 17L18 12" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function LoginSecurityScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [changePassword] = useChangePasswordMutation();
  const { data: sessionsData, isLoading: isLoadingSessions } = useGetSessionsQuery(undefined, {
    skip: false,
  });
  const [revokeSession] = useRevokeSessionMutation();

  // TODO: Once backend endpoints are ready, add:
  // const [setupTwoFactor] = useSetupTwoFactorMutation();
  // const [disableTwoFactor] = useDisableTwoFactorMutation();

  const handleBack = () => {
    router.back();
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'All password fields are required.',
        duration: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'New passwords do not match.',
        duration: 3000,
      });
      return;
    }

    if (newPassword.length < 8) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 8 characters long.',
        duration: 3000,
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }).unwrap();

      showToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
        duration: 3000,
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to change password. Please try again.';
      showToast({
        type: 'error',
        title: 'Change Failed',
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    try {
      // TODO: Replace with actual API call once backend endpoint is ready:
      // if (value) {
      //   await setupTwoFactor().unwrap();
      // } else {
      //   await disableTwoFactor().unwrap();
      // }

      // Placeholder for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTwoFactorEnabled(value);

      showToast({
        type: 'success',
        title: 'Security Updated',
        message: value
          ? 'Two-factor authentication has been enabled.'
          : 'Two-factor authentication has been disabled.',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error updating two-factor authentication:', error);
      setTwoFactorEnabled(!value); // Revert on error
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to update two-factor authentication. Please try again.';
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 4000,
      });
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    Alert.alert(
      'Revoke Session',
      'Are you sure you want to revoke this session? You will need to sign in again on that device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeSession(sessionId).unwrap();

              showToast({
                type: 'success',
                title: 'Session Revoked',
                message: 'The session has been revoked successfully.',
                duration: 3000,
              });
            } catch (error: any) {
              console.error('Error revoking session:', error);
              const errorMessage =
                error?.data?.error?.message ||
                error?.data?.message ||
                error?.message ||
                'Failed to revoke session. Please try again.';
              showToast({
                type: 'error',
                title: 'Revoke Failed',
                message: errorMessage,
                duration: 4000,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Login & Security',
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

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Login & Security</Text>

          {/* Change Password Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <SvgXml xml={lockIconSVG} width={20} height={20} />
              </View>
              <Text style={styles.sectionTitle}>Password</Text>
            </View>

            {!showPasswordForm ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowPasswordForm(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>Change Password</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.passwordForm}>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Current Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <Text style={styles.eyeButtonText}>
                        {showCurrentPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Text style={styles.eyeButtonText}>
                        {showNewPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Confirm New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Text style={styles.eyeButtonText}>
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.passwordFormActions}>
                  <TouchableOpacity
                    style={[styles.cancelButton, isChangingPassword && styles.buttonDisabled]}
                    onPress={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={isChangingPassword}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      isChangingPassword && styles.buttonDisabled,
                    ]}
                    onPress={handleChangePassword}
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Two-Factor Authentication Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <SvgXml xml={shieldIconSVG} width={20} height={20} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
                <Text style={styles.sectionSubtitle}>
                  Add an extra layer of security to your account
                </Text>
              </View>
            </View>
            <View style={styles.toggleItem}>
              <Switch
                value={twoFactorEnabled}
                onValueChange={handleToggleTwoFactor}
                trackColor={{ false: '#E5E7EB', true: '#FF3B30' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* Active Sessions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <SvgXml xml={deviceIconSVG} width={20} height={20} />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Active Sessions</Text>
                <Text style={styles.sectionSubtitle}>
                  Manage devices where you're signed in
                </Text>
              </View>
            </View>

            {isLoadingSessions ? (
              <View style={styles.placeholderContainer}>
                <ActivityIndicator size="small" color="#094327" />
                <Text style={styles.placeholderText}>Loading sessions...</Text>
              </View>
            ) : sessionsData?.data?.sessions && sessionsData.data.sessions.length > 0 ? (
              sessionsData.data.sessions.map((session) => (
                <View key={session.session_id} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDevice}>{session.device}</Text>
                    <Text style={styles.sessionLocation}>{session.location}</Text>
                    <Text style={styles.sessionTime}>
                      Created: {new Date(session.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {!session.is_current && (
                    <TouchableOpacity
                      style={styles.revokeButton}
                      onPress={() => handleRevokeSession(session.session_id)}
                    >
                      <Text style={styles.revokeButtonText}>Revoke</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No active sessions found.</Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  passwordForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFFFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  passwordFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  toggleItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sessionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  sessionLocation: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 2,
  },
  sessionTime: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
  },
  revokeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  revokeButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#EF4444',
  },
  placeholderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});

