import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAccount } from '@/hooks/useAccount';
import { useProfile } from '@/hooks/useProfile';
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
  const [sessionsData, setSessionsData] = useState<any>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Use account hook for Convex actions
  const {
    changePassword,
    getSessions,
    revokeSession,
    setup2FA,
    disable2FA,
    isLoading: accountLoading,
  } = useAccount();
  
  // Use profile hook to get user's 2FA status
  const { getCustomerProfile } = useProfile();
  
  // 2FA state
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

  // Fetch sessions and 2FA status on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingSessions(true);
        
        // Fetch sessions
        const sessionsResult = await getSessions();
        if (sessionsResult.success && sessionsResult.data?.sessions) {
          setSessionsData({ data: { sessions: sessionsResult.data.sessions } });
        }
        
        // Fetch profile to get 2FA status
        try {
          const profileResult = await getCustomerProfile();
          if (profileResult.success && profileResult.data?.user) {
            // Note: 2FA status might not be in the profile response
            // If it's not available, we'll keep the default false
            // The toggle will update it when used
          }
        } catch (profileError) {
          // Profile fetch is optional, don't fail if it errors
          console.log('Could not fetch profile for 2FA status:', profileError);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    fetchData();
  }, [getSessions, getCustomerProfile]);

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
      await changePassword(currentPassword, newPassword);

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      // Error handling is done in the hook
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleTwoFactor = async (value: boolean) => {
    try {
      if (value) {
        // Enable 2FA - setup flow
        setIsSettingUp2FA(true);
        try {
          const result = await setup2FA();
          if (result.success && result.data) {
            setQrCodeData(result.data.qrCode);
            setBackupCodes(result.data.backupCodes);
            setTwoFactorEnabled(true);
            setShowQRCodeModal(true);
          }
        } catch (error: any) {
          console.error('Error setting up 2FA:', error);
          setTwoFactorEnabled(false);
        } finally {
          setIsSettingUp2FA(false);
        }
      } else {
        // Disable 2FA
        try {
          await disable2FA();
          setTwoFactorEnabled(false);
        } catch (error: any) {
          console.error('Error disabling 2FA:', error);
          setTwoFactorEnabled(true); // Revert on error
        }
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      setTwoFactorEnabled(!value); // Revert on error
    }
  };
  
  const handleQRCodeModalClose = () => {
    setShowQRCodeModal(false);
    // Show backup codes modal after QR code is dismissed
    if (backupCodes.length > 0) {
      setShowBackupCodesModal(true);
    }
  };
  
  const handleBackupCodesModalClose = () => {
    setShowBackupCodesModal(false);
    setBackupCodes([]); // Clear backup codes after showing (one-time only)
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
              await revokeSession(sessionId);
              
              // Refresh sessions after revoking
              const result = await getSessions();
              if (result.success && result.data?.sessions) {
                setSessionsData({ data: { sessions: result.data.sessions } });
              }
            } catch (error: any) {
              console.error('Error revoking session:', error);
              // Error handling is done in the hook
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

            {(isLoadingSessions || accountLoading) ? (
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
      
      {/* QR Code Modal */}
      <Modal
        visible={showQRCodeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleQRCodeModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan QR Code</Text>
              <TouchableOpacity onPress={handleQRCodeModalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Scan this QR code with your authenticator app to enable two-factor authentication.
            </Text>
            {qrCodeData ? (
              <View style={styles.qrCodeContainer}>
                <Image source={{ uri: qrCodeData }} style={styles.qrCodeImage} />
              </View>
            ) : (
              <View style={styles.qrCodeContainer}>
                <ActivityIndicator size="large" color="#094327" />
              </View>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleQRCodeModalClose}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Backup Codes Modal */}
      <Modal
        visible={showBackupCodesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleBackupCodesModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backup Codes</Text>
              <TouchableOpacity onPress={handleBackupCodesModalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator app.
            </Text>
            <ScrollView style={styles.backupCodesContainer}>
              {backupCodes.map((code, index) => (
                <View key={index} style={styles.backupCodeItem}>
                  <Text style={styles.backupCodeText}>{code}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleBackupCodesModalClose}
            >
              <Text style={styles.modalButtonText}>I've Saved These Codes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
  },
  modalCloseText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#FF3B30',
  },
  modalDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 24,
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 24,
    minHeight: 250,
  },
  qrCodeImage: {
    width: 250,
    height: 250,
  },
  backupCodesContainer: {
    maxHeight: 300,
    marginBottom: 24,
  },
  backupCodeItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  backupCodeText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modalButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});

